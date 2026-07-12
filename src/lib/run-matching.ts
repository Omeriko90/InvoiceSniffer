import { prisma } from "@/lib/prisma"
import {
  MATCH_THRESHOLD,
  POSSIBLE_THRESHOLD,
  NO_MATCH_REASON,
  LOW_SCORE_REASON,
  RULE_NO_INVOICE_REASON,
  normalizeMerchant,
  rankCandidates,
  type AliasSignal,
  type InvoiceCandidate,
} from "@/lib/matching"

type AliasRow = {
  merchantPattern: string
  vendorName: string
  type: "POSITIVE" | "NEGATIVE" | "IGNORE"
}

function aliasApplies(alias: AliasRow, merchantNorm: string): boolean {
  const pattern = normalizeMerchant(alias.merchantPattern)
  return pattern.length > 0 && (merchantNorm === pattern || merchantNorm.startsWith(pattern))
}

export function loadAliases(organizationId: string) {
  return prisma.vendorAlias.findMany({
    where: { organizationId, active: true },
    select: { merchantPattern: true, vendorName: true, type: true },
  })
}

export function aliasSignalFor(
  aliases: AliasRow[],
  merchant: string,
  inv: InvoiceCandidate
): AliasSignal {
  const merchantNorm = normalizeMerchant(merchant)
  const vendorNorm = normalizeMerchant(inv.vendorName ?? "")
  if (!vendorNorm) return null
  for (const alias of aliases) {
    if (!aliasApplies(alias, merchantNorm)) continue
    if (normalizeMerchant(alias.vendorName) !== vendorNorm) continue
    if (alias.type === "POSITIVE") return "positive"
    if (alias.type === "NEGATIVE") return "negative"
  }
  return null
}

export async function loadInvoiceCandidates(organizationId: string): Promise<InvoiceCandidate[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: "IGNORED" },
      // 1:1 — invoices already locked in by a user-confirmed transaction are taken
      transactions: { none: { matchConfirmed: true } },
    },
    select: {
      id: true,
      vendorName: true,
      invoiceNumber: true,
      totalAmount: true,
      currency: true,
      invoiceDate: true,
      emailDate: true,
    },
  })
  return invoices.map((inv) => ({
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    totalAmount: Number(inv.totalAmount),
    currency: inv.currency,
    effectiveDate: inv.invoiceDate ?? inv.emailDate,
  }))
}

// (Re)run matching for an org. User-confirmed matches and user decisions
// (NO_INVOICE, rejections kept as UNMATCHED) are frozen; only suggested
// states are recomputed. Safe to re-run any time.
export async function runMatching(organizationId: string): Promise<{ scanned: number }> {
  const [txns, invoices, aliases] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId,
        matchConfirmed: false,
        status: { in: ["UNMATCHED", "POSSIBLE", "MATCHED"] },
      },
      orderBy: { date: "asc" },
    }),
    loadInvoiceCandidates(organizationId),
    loadAliases(organizationId),
  ])

  const ignoreAliases = aliases.filter((a) => a.type === "IGNORE")
  const mapAliases = aliases.filter((a) => a.type !== "IGNORE") as AliasRow[]

  // Score every txn↔invoice pair, then assign greedily by descending score
  // so each invoice links to at most one transaction.
  type Assignment = { txnId: string; invoiceId: string; score: number; reason: string }
  const proposals: Assignment[] = []
  const ignored = new Set<string>()

  for (const txn of txns) {
    const merchantNorm = normalizeMerchant(txn.merchant)
    if (ignoreAliases.some((a) => aliasApplies(a as AliasRow, merchantNorm))) {
      ignored.add(txn.id)
      continue
    }
    const txnInput = {
      date: txn.date,
      amount: Number(txn.amount),
      currency: txn.currency,
      merchant: txn.merchant,
    }
    for (const c of rankCandidates(txnInput, invoices, (inv) =>
      aliasSignalFor(mapAliases, txn.merchant, inv)
    )) {
      proposals.push({ txnId: txn.id, invoiceId: c.invoiceId, score: c.score, reason: c.reason })
    }
  }

  proposals.sort((a, b) => b.score - a.score)
  const takenTxns = new Set<string>()
  const takenInvoices = new Set<string>()
  const assigned = new Map<string, Assignment>()
  for (const p of proposals) {
    if (p.score < POSSIBLE_THRESHOLD) break
    if (takenTxns.has(p.txnId) || takenInvoices.has(p.invoiceId)) continue
    takenTxns.add(p.txnId)
    takenInvoices.add(p.invoiceId)
    assigned.set(p.txnId, p)
  }

  // Write in bulk (one updateMany per group) — per-row updates over a
  // serverless connection blow the transaction timeout on large imports.
  const txnsWithProposals = new Set(proposals.map((p) => p.txnId))
  const ignoredIds: string[] = []
  const noMatchIds: string[] = []
  const lowScoreIds: string[] = []
  const matchWrites: Promise<unknown>[] = []

  for (const txn of txns) {
    if (ignored.has(txn.id)) {
      if (txn.status !== "NO_INVOICE") ignoredIds.push(txn.id)
      continue
    }
    const match = assigned.get(txn.id)
    if (!match) {
      const reason = txnsWithProposals.has(txn.id) ? LOW_SCORE_REASON : NO_MATCH_REASON
      if (txn.status !== "UNMATCHED" || txn.matchedInvoiceId !== null || txn.matchReason !== reason) {
        ;(reason === LOW_SCORE_REASON ? lowScoreIds : noMatchIds).push(txn.id)
      }
      continue
    }
    const status = match.score >= MATCH_THRESHOLD ? "MATCHED" : "POSSIBLE"
    if (
      txn.status !== status ||
      txn.matchedInvoiceId !== match.invoiceId ||
      txn.matchConfidence !== match.score ||
      txn.matchReason !== match.reason
    ) {
      matchWrites.push(
        prisma.transaction.update({
          where: { id: txn.id },
          data: {
            status,
            matchedInvoiceId: match.invoiceId,
            matchConfidence: match.score,
            matchReason: match.reason,
          },
        })
      )
    }
  }

  const clearedFields = { matchedInvoiceId: null, matchConfidence: null }
  await Promise.all([
    ignoredIds.length > 0 &&
      prisma.transaction.updateMany({
        where: { id: { in: ignoredIds } },
        data: { status: "NO_INVOICE", ...clearedFields, matchReason: RULE_NO_INVOICE_REASON },
      }),
    noMatchIds.length > 0 &&
      prisma.transaction.updateMany({
        where: { id: { in: noMatchIds } },
        data: { status: "UNMATCHED", ...clearedFields, matchReason: NO_MATCH_REASON },
      }),
    lowScoreIds.length > 0 &&
      prisma.transaction.updateMany({
        where: { id: { in: lowScoreIds } },
        data: { status: "UNMATCHED", ...clearedFields, matchReason: LOW_SCORE_REASON },
      }),
    ...matchWrites,
  ])

  return { scanned: txns.length }
}
