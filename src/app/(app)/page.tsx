"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"
import { StatRow } from "@/components/dashboard/StatRow"
import { ReconciliationCard } from "@/components/dashboard/ReconciliationCard"
import { RecentAlertsCard } from "@/components/dashboard/RecentAlertsCard"

export default function DashboardPage() {
  const { data: dashboardData = { unmatched: 0, possible: 0, matched: 0, matchedDelta: 0, alerts: 0, criticalAlerts: 0, rec: { total: 0, matched: 0, possible: 0, missing: 0, noInvoice: 0 }, recentAlerts: [], monthLabel: "" }, isPending } = useDashboard()

  if( isPending ) return <DashboardSkeleton />
  return (
    <div className="flex flex-col gap-[18px]">
      <StatRow
        unmatched={dashboardData?.unmatched}
        possible={dashboardData?.possible}
        matched={dashboardData?.matched}
        matchedDelta={dashboardData?.matchedDelta}
        alerts={dashboardData?.alerts}
        criticalAlerts={dashboardData?.criticalAlerts}
      />

      {/* Main content */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <ReconciliationCard
          monthLabel={dashboardData?.monthLabel}
          rec={dashboardData?.rec}
          possibleCount={dashboardData?.possible}
          unmatchedCount={dashboardData?.unmatched}
        />
        <RecentAlertsCard alerts={dashboardData?.recentAlerts} />
      </div>

    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-[14px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-[14px] bg-hover" />
        ))}
      </div>
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Skeleton className="h-[320px] rounded-[14px] bg-hover" />
        <Skeleton className="h-[320px] rounded-[14px] bg-hover" />
      </div>
    </div>
  )
}
