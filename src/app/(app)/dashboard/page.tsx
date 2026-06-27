import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { AlertTriangle, GitMerge, CheckCircle, Bell } from "lucide-react"
import Link from "next/link"

// ── Data ─────────────────────────────────────────────────────────

async function getDashboardData(organizationId: string) {
  const now = new Date()
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
  const total = invoicesByStatus.reduce((s, r) => s + r._count, 0) || 1

  return {
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
    recentAlerts,
    monthLabel: format(now, "MMMM yyyy"),
  }
}

// ── Alert helpers ─────────────────────────────────────────────────

const ALERT_META: Record<string, { label: string; color: string; bg: string }> = {
  AMOUNT_HIGH:       { label: "High amount",       color: "#FB7171", bg: "#FEF2F2" },
  AMOUNT_LOW:        { label: "Low amount",        color: "#FBBF24", bg: "#FFFBEB" },
  SPEND_SPIKE:       { label: "Monthly spike",     color: "#FBBF24", bg: "#FFFBEB" },
  MISSING_RECURRING: { label: "Missing recurring", color: "#60A5FA", bg: "#EFF6FF" },
  NEW_VENDOR:        { label: "New vendor",        color: "#60A5FA", bg: "#EFF6FF" },
}

function alertDescription(type: string, details: Record<string, unknown>): string {
  switch (type) {
    case "AMOUNT_HIGH":       return `${details.actual} received (usual range ${details.expected})`
    case "AMOUNT_LOW":        return `${details.actual} received, lower than usual`
    case "SPEND_SPIKE":       return `Spend is ${details.actual} vs median ${details.expected}`
    case "MISSING_RECURRING": return `No invoice this month (expected monthly)`
    case "NEW_VENDOR":        return `First invoice from this vendor`
    default:                  return "Review this alert"
  }
}

// ── Page ─────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const d = await getDashboardData(session.user.organizationId)
  const pct = (n: number) => `${Math.round((n / d.rec.total) * 100)}%`

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">

      {/* ── Stat row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Unmatched"
          value={d.unmatched}
          delta="Needs attention"
          deltaColor="#FB7171"
          iconBg="#FEF2F2"
          iconColor="#FB7171"
          icon={<AlertTriangle size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Possible matches"
          value={d.possible}
          delta="Review suggested"
          deltaColor="#FBBF24"
          iconBg="#FFFBEB"
          iconColor="#FBBF24"
          icon={<GitMerge size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Matched this month"
          value={d.matched}
          delta={d.matchedDelta >= 0 ? `+${d.matchedDelta} vs last month` : `${d.matchedDelta} vs last month`}
          deltaColor="#34D399"
          iconBg="#ECFDF5"
          iconColor="#34D399"
          icon={<CheckCircle size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Open alerts"
          value={d.alerts}
          delta={d.criticalAlerts > 0 ? `${d.criticalAlerts} critical` : "No critical alerts"}
          deltaColor="#A78BFA"
          iconBg="#F5F3FF"
          iconColor="#A78BFA"
          icon={<Bell size={15} strokeWidth={2} />}
        />
      </div>

      {/* ── Two-column content ──────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>

        {/* Reconciliation status */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-[15px] font-[700] text-heading">Reconciliation status</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">{d.monthLabel}</p>
          </div>

          {/* Stacked bar */}
          <div className="h-3 rounded-full flex gap-0.5 overflow-hidden">
            {d.rec.matched   > 0 && <div className="rounded-full bg-success" style={{ width: pct(d.rec.matched) }} />}
            {d.rec.possible  > 0 && <div className="rounded-full bg-warning" style={{ width: pct(d.rec.possible) }} />}
            {d.rec.missing   > 0 && <div className="rounded-full bg-danger"  style={{ width: pct(d.rec.missing) }} />}
            {d.rec.noInvoice > 0 && <div className="rounded-full bg-faint"   style={{ width: pct(d.rec.noInvoice) }} />}
            {d.rec.total === 1    && <div className="rounded-full bg-border flex-1" />}
          </div>

          {/* Legend counts */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Matched",    count: d.rec.matched,   dot: "#34D399" },
              { label: "Possible",   count: d.rec.possible,  dot: "#FBBF24" },
              { label: "Missing",    count: d.rec.missing,   dot: "#FB7171" },
              { label: "No invoice", count: d.rec.noInvoice, dot: "#CBD5E1" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
                  <span className="text-[11.5px] text-text-secondary">{item.label}</span>
                </div>
                <span className="text-[20px] font-[800] text-heading pl-3.5 leading-none">{item.count}</span>
              </div>
            ))}
          </div>

          {/* Needs attention */}
          <div className="flex flex-col gap-2">
            <p className="text-[11.5px] font-[700] text-text-secondary uppercase tracking-[0.04em]">
              Needs your attention
            </p>
            {d.possible > 0 && (
              <AttentionRow
                href="/reconcile"
                bg="#FFFBEB" border="#FDE68A" dot="#FBBF24"
                text={`${d.possible} possible matches to review`}
              />
            )}
            {d.unmatched > 0 && (
              <AttentionRow
                href="/reconcile"
                bg="#FEF2F2" border="#FECACA" dot="#FB7171"
                text={`${d.unmatched} transactions with no matching invoice`}
              />
            )}
            {d.possible === 0 && d.unmatched === 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-success-bg border border-[#BBF7D0] text-[13px] font-[500] text-[#059669]">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                All transactions reconciled
              </div>
            )}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-[700] text-heading">Recent alerts</h2>
            <Link href="/alerts" className="text-[12px] font-[500] text-primary hover:opacity-80">
              All →
            </Link>
          </div>

          {d.recentAlerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-[13px] text-text-secondary">
              No active alerts
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {d.recentAlerts.map((alert) => {
                const meta = ALERT_META[alert.type] ?? { label: alert.type, color: "#94A3B8", bg: "#F1F3F8" }
                const vendor = alert.invoice?.vendorName ?? alert.vendorName
                return (
                  <div key={alert.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full mt-[5px] shrink-0" style={{ background: meta.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-[600] text-heading truncate">{vendor}</span>
                        <span
                          className="text-[10px] font-[600] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">
                        {alertDescription(alert.type, alert.details as Record<string, unknown>)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────

function StatCard({ label, value, delta, deltaColor, icon, iconBg, iconColor }: {
  label: string
  value: number
  delta: string
  deltaColor: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-[600] text-text-secondary leading-tight">{label}</span>
        <div
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[28px] font-[800] text-heading leading-none">{value}</p>
        <p className="text-[12px] font-[600] mt-1.5 leading-none" style={{ color: deltaColor }}>{delta}</p>
      </div>
    </div>
  )
}

function AttentionRow({ href, bg, border, dot, text }: {
  href: string; bg: string; border: string; dot: string; text: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-[13px] font-[500] text-heading hover:opacity-80 transition-opacity"
      style={{ background: bg, borderColor: border }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
      <span className="flex-1">{text}</span>
      <span className="text-text-secondary text-[12px]">→</span>
    </Link>
  )
}
