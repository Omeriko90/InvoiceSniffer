import { differenceInCalendarDays } from "date-fns"
import { normalizeCurrencyCode } from "@/lib/csv-import"

// Matching algorithm per the implementation plan: deterministic, explainable,
// replayable. For each transaction, generate candidate invoices (±date window,
// amount tolerance, plus alias-linked), score with weighted signals, and band
// the result: ≥0.85 matched · 0.55–0.85 possible · <0.55 unmatched.
//
// A charge is never matched on amount + date alone: those two are cheap
// coincidences (many invoices share a total and land on nearby days). We require
// at least one *identity* signal tying the charge to this specific vendor — a
// learned alias, the invoice number appearing in the bank text, or real
// vendor-name overlap — before proposing a candidate.

// Match date window is DIRECTIONAL: a card charge posts AFTER its invoice, so the
// invoice may precede the charge by up to `leadDays` (the org's settlement lag,
// e.g. 30/60/90) but only trail it by a small `trailDays` (timing noise/prepaid).
export type DateWindow = { leadDays: number; trailDays: number }

export const DEFAULT_SETTLEMENT_LAG_DAYS = 30 // invoice may precede charge by up to N days
export const TRAIL_WINDOW_DAYS = 10 // invoice may follow charge by up to N days
export const MIN_SETTLEMENT_LAG_DAYS = 0
export const MAX_SETTLEMENT_LAG_DAYS = 180

export const DEFAULT_DATE_WINDOW: DateWindow = {
  leadDays: DEFAULT_SETTLEMENT_LAG_DAYS,
  trailDays: TRAIL_WINDOW_DAYS,
}

export const AMOUNT_TOLERANCE = 0.02
export const MATCH_THRESHOLD = 0.85
export const POSSIBLE_THRESHOLD = 0.55

const WEIGHTS = { amount: 0.45, date: 0.2, name: 0.35 }
const ALIAS_BOOST = 0.3
const NEGATIVE_PENALTY = 0.6
// Invoice number found verbatim in the bank description — a strong, near-certain
// identity signal, so it alone can carry an exact-amount charge into "matched".
const INVOICE_NUMBER_BOOST = 0.4
// Minimum vendor-name overlap that counts as identity corroboration. 0.3 clears
// one shared token when the shorter name is ≤3 tokens (e.g. "openai chatgpt"
// vs "openai"), while rejecting zero-overlap coincidences.
const NAME_MIN_CORROBORATION = 0.3

export const NO_MATCH_REASON = "No invoice near this charge date"
export const LOW_SCORE_REASON = "No confident match found"
export const USER_NO_INVOICE_REASON = "You marked this — won’t be flagged"
export const RULE_NO_INVOICE_REASON = "Matches your no-invoice rule — won’t be flagged"
export const REJECTED_REASON = "You rejected the suggested match"
export const MANUAL_LINK_REASON = "Linked by you — alias learned"

// Legal/billing noise tokens dropped when comparing names (incl. Hebrew בע״מ forms)
const NOISE_TOKENS = new Set([
  "inc", "llc", "ltd", "corp", "co", "billing", "payments", "subscr",
  "subscription", "help", "trip", "בעמ", "בע",
])

// Bank merchant strings look like "SQ *LINEAR", "OPENAI *CHATGPT SUBSCR",
// "AWS EMEA 0001 LUXEMBOURG", or "הראל-ביטוח בריאות" — strip processor
// prefixes, store codes, and legal noise before comparing to vendor names.
// Unicode-aware so non-Latin vendors survive normalization.
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/^(sq|tst|py|pp|paypal|gpay|apl)\s*\*\s*/, "")
    .replace(/\*/g, " ")
    .replace(/\.(com|io|co|net|org|ai)\b.*$/, "")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !NOISE_TOKENS.has(t) && !/^\d+$/.test(t))
    .join(" ")
}

export function normalizeCurrency(currency: string): string {
  return normalizeCurrencyCode(currency)
}

// Overlap coefficient with prefix-tolerant token equality, so
// "aws emea luxembourg" vs "aws" and "openai chatgpt" vs "openai" score high.
export function nameSimilarity(merchant: string, vendor: string): number {
  const a = normalizeMerchant(merchant).split(" ").filter(Boolean)
  const b = normalizeMerchant(vendor).split(" ").filter(Boolean)
  if (a.length === 0 || b.length === 0) return 0

  const tokenMatch = (x: string, y: string) =>
    x === y || (x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x)))

  let hits = 0
  for (const x of a) if (b.some((y) => tokenMatch(x, y))) hits++
  return hits / Math.min(a.length, b.length)
}

export type TxnInput = {
  date: Date
  amount: number
  currency: string
  merchant: string
}

export type InvoiceCandidate = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  totalAmount: number
  currency: string
  // invoiceDate when extracted, else emailDate
  effectiveDate: Date
}

export type AliasSignal = "positive" | "negative" | null

export type ScoredCandidate = {
  invoiceId: string
  score: number
  reason: string
}

// Compare magnitudes: bank statements list charges as negative debits (-50.00)
// while invoices store the positive total (50.00), so sign must not count.
function amountScore(a: number, b: number): number {
  const x = Math.abs(a)
  const y = Math.abs(b)
  const hi = Math.max(x, y)
  if (hi === 0) return 1
  const diffPct = Math.abs(x - y) / hi
  if (diffPct === 0) return 1
  if (diffPct > AMOUNT_TOLERANCE) return 0
  return 1 - (diffPct / AMOUNT_TOLERANCE) * 0.5
}

// True when the invoice number appears (digits-only) inside the raw bank text.
// Guards against short/noisy numbers that would collide with dates or amounts.
export function invoiceNumberInText(invoiceNumber: string, text: string): boolean {
  const digits = invoiceNumber.replace(/\D/g, "")
  if (digits.length < 4) return false
  return text.replace(/\D/g, "").includes(digits)
}

export function scoreCandidate(
  txn: TxnInput,
  inv: InvoiceCandidate,
  alias: AliasSignal,
  window: DateWindow = DEFAULT_DATE_WINDOW
): ScoredCandidate | null {
  // Currency is a hard gate only when both sides declare one. CSVs often omit a
  // currency column, so an unknown ("") txn currency shouldn't reject an invoice.
  const txnCurrency = normalizeCurrency(txn.currency)
  const invCurrency = normalizeCurrency(inv.currency)
  if (txnCurrency && invCurrency && txnCurrency !== invCurrency) return null

  const amt = amountScore(txn.amount, inv.totalAmount)
  // Signed: >0 when the invoice PRECEDES the charge (normal card settlement lag),
  // <0 when it follows. Allowed asymmetrically per the directional window.
  const signedDays = differenceInCalendarDays(txn.date, inv.effectiveDate)
  const days = Math.abs(signedDays)
  const inWindow = signedDays <= window.leadDays && signedDays >= -window.trailDays

  // Positive-alias candidates survive outside the amount/date gates
  if (alias !== "positive" && (amt === 0 || !inWindow)) return null

  // Proximity is normalized against the bound on the relevant side, so a charge
  // 30 days after its invoice still scores well when leadDays is 60/90.
  const bound = signedDays >= 0 ? window.leadDays : window.trailDays
  const date = inWindow ? (bound > 0 ? 1 - days / bound : 1) : 0
  const name = inv.vendorName ? nameSimilarity(txn.merchant, inv.vendorName) : 0
  const invoiceNumberHit = inv.invoiceNumber
    ? invoiceNumberInText(inv.invoiceNumber, txn.merchant)
    : false

  // Require identity corroboration: amount + date alone is a coincidence, not a
  // match. At least one signal must tie this charge to *this* vendor.
  const hasIdentity =
    alias === "positive" || invoiceNumberHit || name >= NAME_MIN_CORROBORATION
  if (!hasIdentity) return null

  let score = WEIGHTS.amount * amt + WEIGHTS.date * date + WEIGHTS.name * name
  if (invoiceNumberHit) score = Math.min(1, score + INVOICE_NUMBER_BOOST)
  if (alias === "positive") score = Math.min(1, score + ALIAS_BOOST)
  if (alias === "negative") score -= NEGATIVE_PENALTY
  if (score < 0) return null

  const parts: string[] = []
  parts.push(amt === 1 ? "Exact amount" : "Amount within tolerance")
  if (invoiceNumberHit) parts.push("invoice # in description")
  if (alias === "positive") parts.push("vendor alias")
  else if (name >= 0.8) parts.push("strong name match")
  else if (name >= NAME_MIN_CORROBORATION) parts.push("name match")
  if (inWindow) parts.push(days === 0 ? "same day" : `${days} day${days === 1 ? "" : "s"} apart`)

  return { invoiceId: inv.id, score, reason: parts.join(" · ") }
}

// Rank all candidates for one transaction, best first.
export function rankCandidates(
  txn: TxnInput,
  invoices: InvoiceCandidate[],
  aliasFor: (inv: InvoiceCandidate) => AliasSignal,
  window: DateWindow = DEFAULT_DATE_WINDOW
): ScoredCandidate[] {
  return invoices
    .map((inv) => scoreCandidate(txn, inv, aliasFor(inv), window))
    .filter((c): c is ScoredCandidate => c !== null)
    .sort((a, b) => b.score - a.score)
}
