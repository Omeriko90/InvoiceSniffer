import { differenceInCalendarDays } from "date-fns"
import { normalizeCurrencyCode } from "@/lib/csv-import"

// Matching algorithm per the implementation plan: deterministic, explainable,
// replayable. For each transaction, generate candidate invoices (±date window,
// amount tolerance, plus alias-linked), score with weighted signals, and band
// the result: ≥0.85 matched · 0.55–0.85 possible · <0.55 unmatched.

export const DATE_WINDOW_DAYS = 10
export const AMOUNT_TOLERANCE = 0.02
export const MATCH_THRESHOLD = 0.85
export const POSSIBLE_THRESHOLD = 0.55

const WEIGHTS = { amount: 0.45, date: 0.2, name: 0.35 }
const ALIAS_BOOST = 0.3
const NEGATIVE_PENALTY = 0.6

export const NO_MATCH_REASON = `Nothing within the ±${DATE_WINDOW_DAYS} day window`
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

function amountScore(a: number, b: number): number {
  const diffPct = Math.abs(a - b) / Math.max(a, b)
  if (diffPct === 0) return 1
  if (diffPct > AMOUNT_TOLERANCE) return 0
  return 1 - (diffPct / AMOUNT_TOLERANCE) * 0.5
}

export function scoreCandidate(
  txn: TxnInput,
  inv: InvoiceCandidate,
  alias: AliasSignal
): ScoredCandidate | null {
  if (normalizeCurrency(txn.currency) !== normalizeCurrency(inv.currency)) return null

  const amt = amountScore(txn.amount, inv.totalAmount)
  const days = Math.abs(differenceInCalendarDays(txn.date, inv.effectiveDate))
  const inWindow = days <= DATE_WINDOW_DAYS

  // Positive-alias candidates survive outside the amount/date gates
  if (alias !== "positive" && (amt === 0 || !inWindow)) return null

  const date = inWindow ? 1 - days / DATE_WINDOW_DAYS : 0
  const name = inv.vendorName ? nameSimilarity(txn.merchant, inv.vendorName) : 0

  let score = WEIGHTS.amount * amt + WEIGHTS.date * date + WEIGHTS.name * name
  if (alias === "positive") score = Math.min(1, score + ALIAS_BOOST)
  if (alias === "negative") score -= NEGATIVE_PENALTY
  if (score < 0) return null

  const parts: string[] = []
  parts.push(amt === 1 ? "Exact amount" : "Amount within tolerance")
  if (alias === "positive") parts.push("vendor alias")
  else if (name >= 0.8) parts.push("name match")
  else if (name > 0) parts.push("low name similarity")
  if (inWindow) parts.push(days === 0 ? "same day" : `${days} day${days === 1 ? "" : "s"} apart`)

  return { invoiceId: inv.id, score, reason: parts.join(" · ") }
}

// Rank all candidates for one transaction, best first.
export function rankCandidates(
  txn: TxnInput,
  invoices: InvoiceCandidate[],
  aliasFor: (inv: InvoiceCandidate) => AliasSignal
): ScoredCandidate[] {
  return invoices
    .map((inv) => scoreCandidate(txn, inv, aliasFor(inv)))
    .filter((c): c is ScoredCandidate => c !== null)
    .sort((a, b) => b.score - a.score)
}
