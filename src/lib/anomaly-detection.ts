import { prisma } from "@/lib/prisma"
import type { AnomalyType, AnomalySeverity } from "@prisma/client"
import type { AnomalyDetails } from "@/types/alert"

// Anomaly detection: recomputes per-vendor spend baselines (VendorStats) from an
// org's invoices, then flags outliers into AnomalyLog. Deterministic and
// idempotent — safe to re-run after every extraction. Reads only extracted
// invoices (totalAmount > 0); zero-amount rows haven't been parsed yet.
//
// Thresholds are intentionally conservative so the Alerts feed stays signal, not
// noise. Tune here in one place.
const MIN_HISTORY_FOR_AMOUNT = 4      // invoices needed before amount outliers mean anything
const HIGH_RATIO = 1.5                // ≥50% above vendor median → AMOUNT_HIGH
const LOW_RATIO = 0.5                 // ≤50% below vendor median → AMOUNT_LOW
const SEVERE_DEVIATION_PCT = 100      // ≥100% deviation → HIGH severity, else MEDIUM
const SPIKE_MULTIPLE = 2              // month spend ≥2× trailing avg → SPEND_SPIKE
const RECURRING_GRACE_DAYS = 7        // days past the typical date before "missing"

type InvoiceRow = {
  id: string
  vendorName: string | null
  vendorNormalized: string | null
  totalAmount: number
  currency: string
  effectiveDate: Date
}

type ExistingAnomaly = { type: AnomalyType; invoiceId: string | null; vendorName: string; createdAt: Date }

type Candidate = {
  type: AnomalyType
  severity: AnomalySeverity
  vendorName: string
  invoiceId: string | null
  details: AnomalyDetails
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
}

// Group an org's invoices by normalized vendor (falling back to lowercased name).
function groupByVendor(invoices: InvoiceRow[]): Map<string, InvoiceRow[]> {
  const groups = new Map<string, InvoiceRow[]>()
  for (const inv of invoices) {
    const key = inv.vendorNormalized || inv.vendorName?.trim().toLowerCase()
    if (!key) continue // no vendor identity → can't build a baseline
    const list = groups.get(key)
    if (list) list.push(inv)
    else groups.set(key, [inv])
  }
  return groups
}

export async function runAnomalyDetection(organizationId: string): Promise<{ created: number }> {
  const rows = await prisma.invoice.findMany({
    where: { organizationId, status: { not: "IGNORED" }, totalAmount: { gt: 0 } },
    select: {
      id: true,
      vendorName: true,
      vendorNormalized: true,
      totalAmount: true,
      currency: true,
      invoiceDate: true,
      emailDate: true,
    },
  })

  const invoices: InvoiceRow[] = rows.map((r) => ({
    id: r.id,
    vendorName: r.vendorName,
    vendorNormalized: r.vendorNormalized,
    totalAmount: Number(r.totalAmount),
    currency: r.currency,
    effectiveDate: r.invoiceDate ?? r.emailDate,
  }))

  const groups = groupByVendor(invoices)
  const now = new Date()
  const thisMonth = monthKey(now)

  const statsWrites: Promise<unknown>[] = []
  const candidates: Candidate[] = []

  for (const group of groups.values()) {
    const sortedByDate = [...group].sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())
    const latest = sortedByDate[sortedByDate.length - 1]
    const vendorName = latest.vendorName ?? "Unknown vendor"
    const currency = latest.currency
    const amounts = group.map((g) => g.totalAmount)
    const sortedAmounts = [...amounts].sort((a, b) => a - b)
    const count = amounts.length
    const avg = amounts.reduce((s, v) => s + v, 0) / count
    const med = median(sortedAmounts)
    const min = sortedAmounts[0]
    const max = sortedAmounts[count - 1]

    // Recurring cadence: activity in ≥3 distinct months, typical day-of-month
    const monthsActive = new Set(group.map((g) => monthKey(g.effectiveDate)))
    const daysOfMonth = [...group.map((g) => g.effectiveDate.getUTCDate())].sort((a, b) => a - b)
    const typicalDay = Math.round(median(daysOfMonth))
    const isRecurring = monthsActive.size >= 3

    statsWrites.push(
      prisma.vendorStats.upsert({
        where: { organizationId_vendorName: { organizationId, vendorName } },
        create: {
          organizationId, vendorName, invoiceCount: count,
          avgAmount: avg, medianAmount: med, stdDevAmount: stdDev(amounts, avg),
          minAmount: min, maxAmount: max, typicalDayOfMonth: typicalDay, isRecurring,
        },
        update: {
          invoiceCount: count,
          avgAmount: avg, medianAmount: med, stdDevAmount: stdDev(amounts, avg),
          minAmount: min, maxAmount: max, typicalDayOfMonth: typicalDay, isRecurring,
        },
      }),
    )

    // ── NEW_VENDOR: the vendor's only invoice ──────────────────────────
    if (count === 1) {
      candidates.push({
        type: "NEW_VENDOR", severity: "LOW", vendorName, invoiceId: latest.id,
        details: { actual: latest.totalAmount, firstSeenDate: latest.effectiveDate.toISOString(), currency },
      })
    }

    // ── AMOUNT_HIGH / AMOUNT_LOW: latest invoice vs the rest ───────────
    if (count >= MIN_HISTORY_FOR_AMOUNT) {
      const others = sortedByDate.slice(0, -1).map((g) => g.totalAmount).sort((a, b) => a - b)
      const baseMed = median(others)
      if (baseMed > 0) {
        const ratio = latest.totalAmount / baseMed
        const pct = Math.round(Math.abs(ratio - 1) * 100)
        if (ratio >= HIGH_RATIO) {
          candidates.push({
            type: "AMOUNT_HIGH",
            severity: pct >= SEVERE_DEVIATION_PCT ? "HIGH" : "MEDIUM",
            vendorName, invoiceId: latest.id,
            details: { actual: latest.totalAmount, expected: baseMed, pct, rangeLow: others[0], rangeHigh: others[others.length - 1], currency },
          })
        } else if (ratio <= LOW_RATIO) {
          candidates.push({
            type: "AMOUNT_LOW", severity: "MEDIUM", vendorName, invoiceId: latest.id,
            details: { actual: latest.totalAmount, expected: baseMed, pct, currency },
          })
        }
      }
    }

    // ── SPEND_SPIKE: this month's vendor spend vs trailing monthly avg ──
    const byMonth = new Map<string, number>()
    for (const g of group) byMonth.set(monthKey(g.effectiveDate), (byMonth.get(monthKey(g.effectiveDate)) ?? 0) + g.totalAmount)
    const currentMonthTotal = byMonth.get(thisMonth) ?? 0
    const priorMonths = [...byMonth.entries()].filter(([m]) => m !== thisMonth).map(([, v]) => v)
    if (currentMonthTotal > 0 && priorMonths.length >= 2) {
      const trailingAvg = priorMonths.reduce((s, v) => s + v, 0) / priorMonths.length
      if (trailingAvg > 0 && currentMonthTotal >= SPIKE_MULTIPLE * trailingAvg) {
        candidates.push({
          type: "SPEND_SPIKE", severity: "MEDIUM", vendorName, invoiceId: latest.id,
          details: { actual: currentMonthTotal, expected: Math.round(trailingAvg * 100) / 100, multiple: Math.round((currentMonthTotal / trailingAvg) * 10) / 10, currency },
        })
      }
    }

    // ── MISSING_RECURRING: recurring vendor with nothing this month ────
    if (isRecurring && !byMonth.has(thisMonth)) {
      const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), typicalDay))
      const overdueDays = Math.floor((now.getTime() - expected.getTime()) / 86_400_000)
      if (overdueDays >= RECURRING_GRACE_DAYS) {
        candidates.push({
          type: "MISSING_RECURRING", severity: "MEDIUM", vendorName, invoiceId: null,
          details: { expected: med, overdueDays, expectedDate: expected.toISOString(), currency },
        })
      }
    }
  }

  // Idempotency: never recreate an anomaly we've already logged. Invoice-scoped
  // types dedupe on (type, invoiceId) forever (so a user's dismissal sticks);
  // vendor-scoped types dedupe on (type, vendorName) within the current month.
  const existing: ExistingAnomaly[] = await prisma.anomalyLog.findMany({
    where: { organizationId },
    select: { type: true, invoiceId: true, vendorName: true, createdAt: true },
  })
  const seenInvoice = new Set(existing.filter((e) => e.invoiceId).map((e) => `${e.type}:${e.invoiceId}`))
  const seenVendorMonth = new Set(existing.map((e) => `${e.type}:${e.vendorName}:${monthKey(e.createdAt)}`))

  const fresh = candidates.filter((c) => {
    if (c.invoiceId) return !seenInvoice.has(`${c.type}:${c.invoiceId}`)
    return !seenVendorMonth.has(`${c.type}:${c.vendorName}:${thisMonth}`)
  })

  await Promise.all(statsWrites)

  if (fresh.length > 0) {
    await prisma.anomalyLog.createMany({
      data: fresh.map((c) => ({
        organizationId,
        invoiceId: c.invoiceId,
        vendorName: c.vendorName,
        type: c.type,
        severity: c.severity,
        details: c.details as object,
      })),
    })
    // Flag the invoices behind invoice-scoped anomalies for quick filtering
    const flagIds = fresh.map((c) => c.invoiceId).filter((id): id is string => !!id)
    if (flagIds.length > 0) {
      await prisma.invoice.updateMany({ where: { id: { in: flagIds }, organizationId }, data: { anomalyFlag: true } })
    }
  }

  return { created: fresh.length }
}
