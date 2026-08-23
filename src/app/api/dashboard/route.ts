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
    // Spend by category for the current month. Fetched as rows (not a groupBy)
    // so each invoice contributes its display-currency amount when converted,
    // falling back to the original for older/unconverted invoices. Aggregated by
    // (category, effective currency) below so converted invoices collapse into a
    // single display-currency total while any leftover originals stay separate.
    // Excludes soft-deleted and IGNORED invoices to match every other aggregate.
    prisma.invoice.findMany({
      where: {
        organizationId,
        removedAt: null,
        status: { not: "IGNORED" },
        emailDate: { gte: monthStart, lte: monthEnd },
      },
      select: {
        category: true,
        currency: true,
        totalAmount: true,
        displayAmount: true,
        displayCurrency: true,
      },
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

  // Aggregate spend per (category, effective currency), using each invoice's
  // display-currency amount when it has one, else its original. UNCATEGORIZED is
  // dropped from the headline breakdown. Sorted by spend desc so the biggest
  // expense types lead.
  const catTotals = new Map<string, { category: string; currency: string; total: number; count: number }>()
  for (const r of invoicesByCategory) {
    if (r.category === "UNCATEGORIZED") continue
    const converted = r.displayAmount != null && r.displayCurrency
    const amount = converted ? Number(r.displayAmount) : Number(r.totalAmount)
    const currency = converted ? r.displayCurrency! : r.currency
    const key = `${r.category}|${currency}`
    const bucket = catTotals.get(key) ?? { category: r.category, currency, total: 0, count: 0 }
    bucket.total += amount
    bucket.count += 1
    catTotals.set(key, bucket)
  }
  const spendByCategory = Array.from(catTotals.values()).sort((a, b) => b.total - a.total)

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
