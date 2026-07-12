import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReconcileClient, type TransactionRow } from "@/components/reconcile/ReconcileClient"

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
      matchedInvoice: {
        select: { id: true, vendorName: true, invoiceNumber: true },
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
    invoice: txn.matchedInvoice,
  }))
}

export default async function ReconcilePage() {
  const session = await auth()
  if (!session) return null

  const transactions = await getTransactions(session.user.organizationId)

  return <ReconcileClient transactions={transactions} />
}
