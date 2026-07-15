import {
  MATCH_THRESHOLD,
  POSSIBLE_THRESHOLD,
  NO_MATCH_REASON,
  LOW_SCORE_REASON,
  RULE_NO_INVOICE_REASON,
  DEFAULT_DATE_WINDOW,
  normalizeMerchant,
  rankCandidates,
  type DateWindow,
} from "@/lib/matching"
import { aliasApplies, aliasSignalFor, type AliasRow, type SessionInvoice } from "@/lib/matching-data"

// A parsed CSV row for one reconcile session. Never persisted — carries a
// session-local id (assigned by the caller) so the UI can key actions on it.
export type SessionRow = {
  id: string
  date: Date
  merchant: string
  amount: number
  currency: string
  sourceFile: string
}

export type MatchBand = "matched" | "possible" | "missing" | "ignored"

export type SessionResult = {
  row: SessionRow
  invoice: SessionInvoice | null
  score: number | null
  reason: string
  band: MatchBand
  // The assigned invoice was already reconciled in a prior session — surfaced as
  // a warning (possible duplicate charge / re-uploaded statement) rather than a
  // silent re-match.
  collision: boolean
}

export type SessionSummary = {
  charges: number
  matched: number
  possible: number
  chargesMissingInvoice: number
  invoicesMissingCharge: number
  collisions: number
}

export type SessionMatch = {
  results: SessionResult[]
  // In-range invoices not yet reconciled that no charge matched this session.
  unreconciledInvoices: SessionInvoice[]
  summary: SessionSummary
}

// Pure, in-memory reconciliation: score every row↔invoice pair, assign greedily
// by descending score so each invoice links to at most one charge, and report
// leftovers on both sides. No DB access — takes pre-loaded invoices/aliases so
// it stays deterministic and unit-testable.
export function matchSession(
  rows: SessionRow[],
  invoices: SessionInvoice[],
  aliases: AliasRow[],
  window: DateWindow = DEFAULT_DATE_WINDOW
): SessionMatch {
  const ignoreAliases = aliases.filter((a) => a.type === "IGNORE")
  const mapAliases = aliases.filter((a) => a.type !== "IGNORE")

  type Proposal = { rowId: string; invoiceId: string; score: number; reason: string }
  const proposals: Proposal[] = []
  const ignored = new Set<string>()
  const hadProposals = new Set<string>()

  for (const row of rows) {
    const merchantNorm = normalizeMerchant(row.merchant)
    if (ignoreAliases.some((a) => aliasApplies(a, merchantNorm))) {
      ignored.add(row.id)
      continue
    }
    for (const c of rankCandidates(row, invoices, (inv) =>
      aliasSignalFor(mapAliases, row.merchant, inv), window
    )) {
      proposals.push({ rowId: row.id, invoiceId: c.invoiceId, score: c.score, reason: c.reason })
      hadProposals.add(row.id)
    }
  }

  proposals.sort((a, b) => b.score - a.score)
  const takenRows = new Set<string>()
  const takenInvoices = new Set<string>()
  const assigned = new Map<string, Proposal>()
  for (const p of proposals) {
    if (p.score < POSSIBLE_THRESHOLD) break
    if (takenRows.has(p.rowId) || takenInvoices.has(p.invoiceId)) continue
    takenRows.add(p.rowId)
    takenInvoices.add(p.invoiceId)
    assigned.set(p.rowId, p)
  }

  const invoiceById = new Map(invoices.map((inv) => [inv.id, inv]))

  const results: SessionResult[] = rows.map((row) => {
    if (ignored.has(row.id)) {
      return { row, invoice: null, score: null, reason: RULE_NO_INVOICE_REASON, band: "ignored", collision: false }
    }
    const match = assigned.get(row.id)
    if (!match) {
      const reason = hadProposals.has(row.id) ? LOW_SCORE_REASON : NO_MATCH_REASON
      return { row, invoice: null, score: null, reason, band: "missing", collision: false }
    }
    const invoice = invoiceById.get(match.invoiceId) ?? null
    const band: MatchBand = match.score >= MATCH_THRESHOLD ? "matched" : "possible"
    return {
      row,
      invoice,
      score: match.score,
      reason: match.reason,
      band,
      collision: invoice?.status === "MATCHED",
    }
  })

  // Open invoices (not already reconciled) that no charge matched this session.
  const unreconciledInvoices = invoices.filter(
    (inv) => inv.status !== "MATCHED" && !takenInvoices.has(inv.id)
  )

  const summary: SessionSummary = {
    charges: rows.length,
    matched: results.filter((r) => r.band === "matched").length,
    possible: results.filter((r) => r.band === "possible").length,
    chargesMissingInvoice: results.filter((r) => r.band === "missing").length,
    invoicesMissingCharge: unreconciledInvoices.length,
    collisions: results.filter((r) => r.collision).length,
  }

  return { results, unreconciledInvoices, summary }
}
