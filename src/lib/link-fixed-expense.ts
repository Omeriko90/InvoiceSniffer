import { prisma } from "@/lib/prisma"
import { matchesExpense } from "@/lib/fixed-expenses"

// Link a freshly-ingested invoice to the first active fixed expense it matches
// (by normalized vendor or sender email; a pinned mailbox must also match). This
// runs inline in the ingestion pipeline — see invoice-extract.ts — so arrival
// tracking is a natural consequence of extraction, not a separate job. Idempotent
// and best-effort: a failure here must never fail the extraction, and an invoice
// already linked (e.g. via the drawer) is left untouched.
export async function linkInvoiceToMatchingFixedExpense(invoice: {
  id: string
  organizationId: string
  fixedExpenseId: string | null
  vendorNormalized: string | null
  senderEmail: string | null
  gmailCredentialId: string | null
}): Promise<string | null> {
  if (invoice.fixedExpenseId) return invoice.fixedExpenseId

  const expenses = await prisma.fixedExpense.findMany({
    where: { organizationId: invoice.organizationId, status: "ACTIVE" },
    select: { id: true, vendorNormalized: true, senderEmail: true, gmailCredentialId: true },
  })
  if (expenses.length === 0) return null

  const match = expenses.find((expense) => matchesExpense(invoice, expense))
  if (!match) return null

  await prisma.invoice.update({ where: { id: invoice.id }, data: { fixedExpenseId: match.id } })
  return match.id
}
