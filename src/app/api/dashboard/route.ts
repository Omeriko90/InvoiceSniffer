import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveDateRange, InvalidDateRangeError } from "@/lib/date-range"
import type { Prisma } from "@prisma/client"

// Financial-overview dashboard. Range-scoped counts + spend + reclaimable VAT
// for the selected window. The range comes in as ?from&to (ISO); it's
// re-validated here so a crafted range can't drive an unbounded scan.
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

  // Shared scope for every range aggregate: this org's live invoices in-window.
  const scoped: Prisma.InvoiceWhereInput = {
    organizationId,
    removedAt: null,
    status: { not: "IGNORED" },
    emailDate: { gte: from, lte: to },
  }

  const [
    invoiceCount,
    receiptCount,
    spendByCurrency,
    invoicesByCategory,
    invoicesByVendor,
    invoicesByTax,
  ] = await Promise.all([
    prisma.invoice.count({ where: { ...scoped, documentType: "TAX_INVOICE" } }),
    prisma.invoice.count({ where: { ...scoped, documentType: "RECEIPT" } }),
    // Headline spend, grouped by currency so mixed-currency orgs aren't summed
    // into a meaningless total.
    prisma.invoice.groupBy({
      by: ["currency"],
      where: scoped,
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Spend by category (+ currency) feeds the pie chart. UNCATEGORIZED dropped
    // from the breakdown below.
    prisma.invoice.groupBy({
      by: ["category", "currency"],
      where: scoped,
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Top vendors by spend within the range.
    prisma.invoice.groupBy({
      by: ["vendorName", "currency"],
      where: scoped,
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Reclaimable VAT within the selected range. Fetched as rows so duplicate
    // copies can be deduped before summing (see below).
    prisma.invoice.findMany({
      where: {
        ...scoped,
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
  ])

  const totalSpend = spendByCurrency
    .map((r) => ({ currency: r.currency, total: Number(r._sum.totalAmount ?? 0), count: r._count }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  // Flatten (category, currency) groups; drop UNCATEGORIZED, sort by spend desc.
  const spendByCategory = invoicesByCategory
    .filter((r) => r.category !== "UNCATEGORIZED")
    .map((r) => ({
      category: r.category,
      currency: r.currency,
      total: Number(r._sum.totalAmount ?? 0),
      count: r._count,
    }))
    .sort((a, b) => b.total - a.total)

  const topVendors = invoicesByVendor
    .filter((r) => r.vendorName)
    .map((r) => ({
      vendor: r.vendorName as string,
      currency: r.currency,
      total: Number(r._sum.totalAmount ?? 0),
      count: r._count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Dedupe copies of the same tax invoice (same Tax Authority allocation number,
  // else same invoice#+vendor+total) so a document arriving as both email body
  // and attachment — or forwarded — isn't counted twice. Rows with no
  // identifying number fall back to their unique id. Then sum VAT per currency.
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
  const reclaimableVat = Array.from(taxTotals.entries())
    .map(([currency, { total, count }]) => ({ currency, total, count }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  return Response.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    invoiceCount,
    receiptCount,
    totalSpend,
    spendByCategory,
    topVendors,
    reclaimableVat,
  })
}
