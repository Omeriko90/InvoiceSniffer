import { differenceInCalendarDays } from "date-fns"
import { prisma } from "@/lib/prisma"
import { currentPeriod, classifyPeriod } from "@/lib/fixed-expenses"
import { log } from "@/lib/posthog-server"

// Missing-invoice detector for fixed expenses. Scheduled to run shortly before a
// period ends (Cloud Scheduler, ~5 days before month end): for every ACTIVE
// fixed expense with no invoice linked in the current period, it writes a
// MISSING_RECURRING alert that surfaces on the Alerts page.
//
// DB-driven (no BullMQ) — the FixedExpense rows are the work list, mirroring the
// MODE=export path. It only READS invoice links and WRITES alerts; it never
// touches arrival status (which is always computed) or creates links (that's the
// ingest linker's job). Idempotent: dedupes on (expense, period) via the
// fixedExpenseId + expectedDate stashed in the alert's details, so re-runs within
// the same period — or after the user acknowledges — never pile up duplicates.
export async function processFixedExpenseAlerts(now: Date = new Date()): Promise<number> {
  const expenses = await prisma.fixedExpense.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      organizationId: true,
      name: true,
      vendorName: true,
      expectedAmount: true,
      currency: true,
      frequency: true,
      anchorDate: true,
      gracePeriodDays: true,
      createdAt: true,
    },
  })

  let created = 0
  for (const expense of expenses) {
    const period = currentPeriod(expense, now)
    // Don't nag for a period that hasn't started yet (future anchor date).
    if (now.getTime() < period.start.getTime()) continue

    const linked = await prisma.invoice.findMany({
      where: { organizationId: expense.organizationId, fixedExpenseId: expense.id },
      select: { emailDate: true },
    })
    const status = classifyPeriod(
      period,
      expense.gracePeriodDays,
      linked.map((inv) => ({
        emailDate: inv.emailDate,
        vendorNormalized: null,
        senderEmail: null,
        gmailCredentialId: null,
      })),
      now,
    )
    if (status === "ARRIVED") continue

    const expectedDate = period.end.toISOString()

    // Idempotency: one alert per (expense, period), regardless of ack state.
    const existing = await prisma.anomalyLog.findFirst({
      where: {
        organizationId: expense.organizationId,
        type: "MISSING_RECURRING",
        AND: [
          { details: { path: ["fixedExpenseId"], equals: expense.id } },
          { details: { path: ["expectedDate"], equals: expectedDate } },
        ],
      },
      select: { id: true },
    })
    if (existing) continue

    const overdueDays = differenceInCalendarDays(now, period.end)
    const details: Record<string, unknown> = { fixedExpenseId: expense.id, expectedDate, currency: expense.currency }
    if (expense.expectedAmount) details.expected = Number(expense.expectedAmount)
    if (overdueDays > 0) details.overdueDays = overdueDays

    await prisma.anomalyLog.create({
      data: {
        organizationId: expense.organizationId,
        vendorName: expense.vendorName[0] ?? expense.name,
        type: "MISSING_RECURRING",
        severity: "MEDIUM",
        details: details as never,
      },
    })
    created++
  }

  log.info(
    `fixed-expenses-check: created ${created} missing-recurring alert(s) across ${expenses.length} active expense(s)`,
  )
  return created
}
