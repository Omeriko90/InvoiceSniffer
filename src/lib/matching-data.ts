import { subDays } from "date-fns"
import { prisma } from "@/lib/prisma"
import { normalizeMerchant, type AliasSignal, type InvoiceCandidate } from "@/lib/matching"
import type { InvoiceStatus } from "@prisma/client"

// DB-backed loaders + alias resolution shared by the reconcile endpoints. Kept
// separate from the pure scorer (matching.ts) so scoring stays testable without
// a database and the session matcher (match-session.ts) can reuse both.

export type AliasRow = {
  merchantPattern: string
  vendorName: string
  type: "POSITIVE" | "NEGATIVE" | "IGNORE"
}

// Invoice candidate enriched with the fields the ephemeral reconcile session
// needs: collision detection (status + prior provenance) and the details the
// match drawer / find modal render (sender, gmail link, due date).
export type SessionInvoice = InvoiceCandidate & {
  status: InvoiceStatus
  reconciledSourceFile: string | null
  reconciledAt: Date | null
  dueDate: Date | null
  senderEmail: string
  gmailLink: string
}

export type DateRange = { from: Date; to: Date }

export function aliasApplies(alias: AliasRow, merchantNorm: string): boolean {
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

// Invoices eligible to match against in a reconcile session, scoped to the
// user-selected date range by effective date (invoiceDate ?? emailDate).
// Already-reconciled (MATCHED) invoices are INCLUDED — the session flags them as
// collisions rather than silently re-matching. Only IGNORED invoices are excluded.
export async function loadInvoiceCandidates(
  organizationId: string,
  range: DateRange,
  // Card charges post after their invoice, so an invoice matching a charge in the
  // range can be dated up to `leadDays` (settlement lag) BEFORE range.from. Widen
  // the lower bound to load those earlier invoices as candidates.
  leadDays = 0
): Promise<SessionInvoice[]> {
  const from = leadDays > 0 ? subDays(range.from, leadDays) : range.from
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: "IGNORED" },
      // Coalesce(invoiceDate, emailDate) within range — Prisma has no COALESCE
      // in `where`, so branch on whether invoiceDate is present.
      OR: [
        { invoiceDate: { gte: from, lte: range.to } },
        { invoiceDate: null, emailDate: { gte: from, lte: range.to } },
      ],
    },
    select: {
      id: true,
      vendorName: true,
      invoiceNumber: true,
      totalAmount: true,
      currency: true,
      invoiceDate: true,
      emailDate: true,
      dueDate: true,
      senderEmail: true,
      gmailLink: true,
      status: true,
      reconciledSourceFile: true,
      reconciledAt: true,
    },
  })
  return invoices.map((inv) => ({
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    totalAmount: Number(inv.totalAmount),
    currency: inv.currency,
    effectiveDate: inv.invoiceDate ?? inv.emailDate,
    status: inv.status,
    reconciledSourceFile: inv.reconciledSourceFile,
    reconciledAt: inv.reconciledAt,
    dueDate: inv.dueDate,
    senderEmail: inv.senderEmail,
    gmailLink: inv.gmailLink,
  }))
}
