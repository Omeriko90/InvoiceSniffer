import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { expenseStatus } from "@/lib/fixed-expenses"
import { FixedExpensesClient } from "@/components/fixed-expenses/FixedExpensesClient"
import type { FixedExpenseRow } from "@/components/fixed-expenses/types"

async function getData(organizationId: string) {
  const [expenses, credentials] = await Promise.all([
    prisma.fixedExpense.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        vendorName: true,
        vendorNormalized: true,
        senderEmail: true,
        gmailCredentialId: true,
        expectedAmount: true,
        currency: true,
        frequency: true,
        anchorDate: true,
        gracePeriodDays: true,
        status: true,
        createdAt: true,
        // Recent linked invoices — enough to classify the current period for any
        // frequency without pulling the whole history.
        invoices: { select: { emailDate: true }, orderBy: { emailDate: "desc" }, take: 24 },
      },
    }),
    prisma.gmailCredential.findMany({
      where: { organizationId },
      select: { id: true, email: true, label: true },
    }),
  ])

  const credById = new Map(credentials.map((c) => [c.id, c]))
  const now = new Date()

  const rows: FixedExpenseRow[] = expenses.map((e) => {
    const cred = e.gmailCredentialId ? credById.get(e.gmailCredentialId) : undefined
    return {
      id: e.id,
      name: e.name,
      category: e.category,
      vendorName: e.vendorName,
      senderEmail: e.senderEmail,
      gmailCredentialId: e.gmailCredentialId,
      expectedAmount: e.expectedAmount?.toString() ?? null,
      currency: e.currency,
      frequency: e.frequency,
      anchorDate: e.anchorDate.toISOString(),
      gracePeriodDays: e.gracePeriodDays,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      currentStatus: expenseStatus(
        {
          anchorDate: e.anchorDate,
          createdAt: e.createdAt,
          frequency: e.frequency,
          gracePeriodDays: e.gracePeriodDays,
          vendorNormalized: e.vendorNormalized,
          senderEmail: e.senderEmail,
          gmailCredentialId: e.gmailCredentialId,
        },
        e.invoices.map((inv) => ({
          emailDate: inv.emailDate,
          vendorNormalized: null,
          senderEmail: null,
          gmailCredentialId: null,
        })),
        now,
      ),
      sourceAccount: cred ? { email: cred.email, label: cred.label } : null,
    }
  })

  const mailboxes = credentials.map((c) => ({ id: c.id, label: c.label ?? c.email }))
  return { rows, mailboxes }
}

export default async function FixedExpensesPage() {
  const session = await auth()
  if (!session) return null

  const { rows, mailboxes } = await getData(session.user.organizationId)
  return <FixedExpensesClient expenses={rows} mailboxes={mailboxes} />
}
