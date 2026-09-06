import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveDateRange, InvalidDateRangeError } from "@/lib/date-range"
import { expenseStatus, rangeExpenseStats } from "@/lib/fixed-expenses"
import type { DashboardFixedExpensesData } from "@/api-types/dashboard"

// Fixed-expenses dashboard card. For the selected ?from&to window it returns the
// org's ACTIVE recurring expenses, each with the arrival status of its latest
// in-range period plus an arrived/total/overdue roll-up across the window. The
// range is re-validated here (same as /api/dashboard) so a crafted range can't
// drive an unbounded scan.
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user
  const now = new Date()

  const url = new URL(request.url)
  const fromParam = url.searchParams.get("from")
  const toParam = url.searchParams.get("to")

  let range: { from: Date; to: Date }
  try {
    range =
      fromParam && toParam
        ? resolveDateRange({ from: fromParam, to: toParam }, now)
        : resolveDateRange({ preset: "ytd" }, now)
  } catch (e) {
    if (e instanceof InvalidDateRangeError) return new Response(e.message, { status: 400 })
    throw e
  }
  const { from, to } = range

  const [expenses, credentials] = await Promise.all([
    prisma.fixedExpense.findMany({
      where: { organizationId, status: "ACTIVE" },
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
        // Every period we classify starts at/after the window floor (>= from),
        // so any invoice that satisfies one also arrives >= from.
        invoices: {
          where: { emailDate: { gte: from } },
          select: { emailDate: true },
          orderBy: { emailDate: "desc" },
        },
      },
    }),
    prisma.gmailCredential.findMany({
      where: { organizationId },
      select: { id: true, email: true, label: true },
    }),
  ])

  const credById = new Map(credentials.map((c) => [c.id, c]))

  const rows: DashboardFixedExpensesData["expenses"] = []
  for (const e of expenses) {
    const linked = e.invoices.map((inv) => ({
      emailDate: inv.emailDate,
      vendorNormalized: null,
      senderEmail: null,
      gmailCredentialId: null,
    }))
    const expenseLike = {
      anchorDate: e.anchorDate,
      createdAt: e.createdAt,
      frequency: e.frequency,
      gracePeriodDays: e.gracePeriodDays,
      vendorNormalized: e.vendorNormalized,
      senderEmail: e.senderEmail,
      gmailCredentialId: e.gmailCredentialId,
    }

    const rangeStats = rangeExpenseStats(expenseLike, linked, range, now)
    // No billing period falls in the window (range predates the expense).
    if (rangeStats.totalCount === 0) continue

    const cred = e.gmailCredentialId ? credById.get(e.gmailCredentialId) : undefined
    rows.push({
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
      currentStatus: expenseStatus(expenseLike, linked, now),
      sourceAccount: cred ? { email: cred.email, label: cred.label } : null,
      rangeStats,
    })
  }

  return Response.json({ range: { from: from.toISOString(), to: to.toISOString() }, expenses: rows })
}
