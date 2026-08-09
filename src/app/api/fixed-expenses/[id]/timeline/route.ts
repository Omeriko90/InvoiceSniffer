import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { addDays } from "date-fns"
import { periodTimeline } from "@/lib/fixed-expenses"
import type { FixedExpenseTimelineEntry, FixedExpenseTimelineResponse } from "@/components/fixed-expenses/types"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 24

// The detail-drawer coverage view: one entry per period (newest first) with the
// invoice that satisfied it, if any. Periods and their status come from the pure
// helper; this route only supplies the linked invoices and pages back.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const url = new URL(request.url)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT))
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)

  const expense = await prisma.fixedExpense.findFirst({
    where: { id, organizationId },
    select: { anchorDate: true, createdAt: true, frequency: true, gracePeriodDays: true },
  })
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const invoices = await prisma.invoice.findMany({
    where: { organizationId, fixedExpenseId: id },
    orderBy: { emailDate: "desc" },
    select: { id: true, vendorName: true, totalAmount: true, currency: true, emailDate: true },
  })

  const now = new Date()
  // periodTimeline only needs emailDate to classify; the other match fields are
  // irrelevant here (these invoices are already linked to this expense).
  const linked = invoices.map((inv) => ({
    emailDate: inv.emailDate,
    vendorNormalized: null,
    senderEmail: null,
    gmailCredentialId: null,
  }))
  const { entries, hasMore } = periodTimeline(
    { ...expense, vendorNormalized: [], senderEmail: [], gmailCredentialId: null },
    linked,
    now,
    { limit, offset },
  )

  const serialized: FixedExpenseTimelineEntry[] = entries.map((entry) => {
    const graceEnd = addDays(entry.end, expense.gracePeriodDays).getTime()
    // Every invoice whose emailDate lands in this period's arrival window
    // (invoices is already newest-first from the query's orderBy).
    const periodInvoices = invoices.filter(
      (inv) => inv.emailDate.getTime() >= entry.start.getTime() && inv.emailDate.getTime() < graceEnd,
    )
    return {
      index: entry.index,
      periodStart: entry.start.toISOString(),
      periodEnd: entry.end.toISOString(),
      status: entry.status,
      invoices: periodInvoices.map((invoice) => ({
        id: invoice.id,
        vendorName: invoice.vendorName,
        totalAmount: invoice.totalAmount.toString(),
        currency: invoice.currency,
        emailDate: invoice.emailDate.toISOString(),
      })),
    }
  })

  const body: FixedExpenseTimelineResponse = { entries: serialized, hasMore }
  return NextResponse.json(body)
}
