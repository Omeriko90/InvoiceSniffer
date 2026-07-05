import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user
  const now        = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd   = endOfMonth(now)
  const prevStart  = startOfMonth(subMonths(now, 1))
  const prevEnd    = endOfMonth(subMonths(now, 1))

  const [
    unmatchedCount,
    possibleCount,
    matchedCount,
    prevMatchedCount,
    alertCount,
    criticalAlertCount,
    invoicesByStatus,
    recentAlerts,
  ] = await Promise.all([
    prisma.invoice.count({ where: { organizationId, status: "UNMATCHED", emailDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.invoice.count({ where: { organizationId, status: "DETECTED",  emailDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.invoice.count({ where: { organizationId, status: "MATCHED",   emailDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.invoice.count({ where: { organizationId, status: "MATCHED",   emailDate: { gte: prevStart,  lte: prevEnd  } } }),
    prisma.anomalyLog.count({ where: { organizationId, acknowledged: false } }),
    prisma.anomalyLog.count({ where: { organizationId, acknowledged: false, severity: "HIGH" } }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { organizationId, emailDate: { gte: monthStart, lte: monthEnd } },
      _count: true,
    }),
    prisma.anomalyLog.findMany({
      where: { organizationId, acknowledged: false },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { invoice: { select: { vendorName: true } } },
    }),
  ])

  const byStatus = Object.fromEntries(invoicesByStatus.map((r) => [r.status, r._count]))
  const total    = invoicesByStatus.reduce((s, r) => s + r._count, 0) || 1

  return Response.json({
    unmatched:      unmatchedCount,
    possible:       possibleCount,
    matched:        matchedCount,
    matchedDelta:   matchedCount - prevMatchedCount,
    alerts:         alertCount,
    criticalAlerts: criticalAlertCount,
    rec: {
      total,
      matched:   byStatus["MATCHED"]   ?? 0,
      possible:  byStatus["DETECTED"]  ?? 0,
      missing:   byStatus["UNMATCHED"] ?? 0,
      noInvoice: byStatus["REVIEWED"]  ?? 0,
    },
    recentAlerts: recentAlerts.map((a) => ({
      id:        a.id,
      type:      a.type,
      details:   a.details,
      vendorName: a.vendorName,
      invoice:   a.invoice,
    })),
    monthLabel: format(now, "MMMM yyyy"),
  })
}
