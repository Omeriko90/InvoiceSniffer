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
    invoicesByCategory,
    invoicesByTax,
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
      where: { organizationId, status: { not: "IGNORED" }, emailDate: { gte: monthStart, lte: monthEnd } },
      _count: true,
    }),
    // Spend by category for the current month. Grouped by category AND currency
    // so mixed-currency orgs aren't summed into a meaningless total. Excludes
    // soft-deleted and IGNORED invoices to match every other list/aggregate.
    prisma.invoice.groupBy({
      by: ["category", "currency"],
      where: {
        organizationId,
        removedAt: null,
        status: { not: "IGNORED" },
        emailDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Reclaimable VAT this month. Only TAX_INVOICE documents carry deductible
    // VAT, so plain receipts/unknown docs are excluded. Fetched as rows (not a
    // groupBy) so duplicate copies of the same invoice can be deduped before
    // summing — see the dedupe below.
    prisma.invoice.findMany({
      where: {
        organizationId,
        removedAt: null,
        status: { not: "IGNORED" },
        documentType: "TAX_INVOICE",
        emailDate: { gte: monthStart, lte: monthEnd },
        taxAmount: { not: null },
      },
      select: {
        id: true,
        currency: true,
        taxAmount: true,
        allocationNumber: true,
        invoiceNumber: true,
        vendorNormalized: true,
        totalAmount: true,
      },
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

  // Flatten the (category, currency) groups into rows the dashboard renders
  // directly. UNCATEGORIZED is dropped from the headline breakdown. Sorted by
  // spend desc so the biggest expense types lead.
  const spendByCategory = invoicesByCategory
    .filter((r) => r.category !== "UNCATEGORIZED")
    .map((r) => ({
      category: r.category,
      currency: r.currency,
      total: Number(r._sum.totalAmount ?? 0),
      count: r._count,
    }))
    .sort((a, b) => b.total - a.total)

  // Dedupe copies of the same tax invoice (same Tax Authority allocation number,
  // else same invoice#+vendor+total) so a document arriving as both email body
  // and attachment — or forwarded — isn't counted twice. Rows with no
  // identifying number fall back to their unique id, so distinct invoices are
  // never merged. Then sum reclaimable VAT per currency.
  const seenTax = new Set<string>()
  const taxTotals = new Map<string, { total: number; count: number }>()
  for (const r of invoicesByTax) {
    const key =
      r.allocationNumber ??
      (r.invoiceNumber ? `${r.invoiceNumber}|${r.vendorNormalized ?? ""}|${r.totalAmount}` : r.id)
    if (seenTax.has(key)) continue
    seenTax.add(key)
    const bucket = taxTotals.get(r.currency) ?? { total: 0, count: 0 }
    bucket.total += Number(r.taxAmount ?? 0)
    bucket.count += 1
    taxTotals.set(r.currency, bucket)
  }
  const taxByMonth = Array.from(taxTotals.entries())
    .map(([currency, { total, count }]) => ({ currency, total, count }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

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
    spendByCategory,
    taxByMonth,
    recentAlerts: recentAlerts.map((a) => ({
      id:        a.id,
      type:      a.type,
      severity:  a.severity,
      details:   a.details,
      vendorName: a.vendorName,
      invoice:   a.invoice,
    })),
    monthLabel: format(now, "MMMM yyyy"),
  })
}
