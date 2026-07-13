import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReconcileClient } from "@/components/reconcile/ReconcileClient"
import type { TransactionRow } from "@/components/reconcile/types"

async function getTransactions(organizationId: string): Promise<TransactionRow[]> {
  const transactions = await prisma.transaction.findMany({
    where: { organizationId },
    orderBy: { date: "asc" },
    take: 500,
    select: {
      id: true,
      date: true,
      merchant: true,
      amount: true,
      currency: true,
      status: true,
      matchConfidence: true,
      matchReason: true,
      matchConfirmed: true,
      sourceFile: true,
      matchedInvoice: {
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
        },
      },
    },
  })

  return transactions.map((txn) => ({
    id: txn.id,
    date: txn.date.toISOString(),
    merchant: txn.merchant,
    amount: txn.amount.toString(),
    currency: txn.currency,
    status: txn.status,
    matchConfidence: txn.matchConfidence,
    matchReason: txn.matchReason,
    matchConfirmed: txn.matchConfirmed,
    sourceFile: txn.sourceFile,
    invoice: txn.matchedInvoice && {
      id: txn.matchedInvoice.id,
      vendorName: txn.matchedInvoice.vendorName,
      invoiceNumber: txn.matchedInvoice.invoiceNumber,
      amount: txn.matchedInvoice.totalAmount.toString(),
      currency: txn.matchedInvoice.currency,
      date: (txn.matchedInvoice.invoiceDate ?? txn.matchedInvoice.emailDate).toISOString(),
      dueDate: txn.matchedInvoice.dueDate?.toISOString() ?? null,
      senderEmail: txn.matchedInvoice.senderEmail,
      gmailLink: txn.matchedInvoice.gmailLink,
    },
  }))
}

export default async function ReconcilePage() {
  const session = await auth()
  if (!session) return null

  const transactions = await getTransactions(session.user.organizationId)

  return <ReconcileClient transactions={transactions} />
}
