"use client"

import { X, Clock, Check, Bell } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { StatCard } from "@/components/dashboard/StatCard"
import { ReconciliationCard } from "@/components/dashboard/ReconciliationCard"
import { RecentAlertsCard } from "@/components/dashboard/RecentAlertsCard"

export default function DashboardPage() {
  const { data: dashboardData = { unmatched: 0, possible: 0, matched: 0, matchedDelta: 0, alerts: 0, criticalAlerts: 0, rec: { total: 0, matched: 0, possible: 0, missing: 0, noInvoice: 0 }, recentAlerts: [], monthLabel: "" }, isPending } = useDashboard()

  if( isPending ) return <DashboardSkeleton />
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-[14px]">
        <StatCard
          label="Unmatched"
          value={dashboardData?.unmatched}
          delta="needs review"
          deltaColor="#FB7171"
          iconBg="#FB7171"
          icon={<X size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Possible matches"
          value={dashboardData?.possible}
          delta="awaiting confirm"
          deltaColor="#B45309"
          iconBg="#FBBF24"
          icon={<Clock size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Matched this month"
          value={dashboardData?.matched}
          delta={dashboardData?.matchedDelta >= 0 ? `+${dashboardData?.matchedDelta} this week` : `${dashboardData?.matchedDelta} vs last month`}
          deltaColor="#059669"
          iconBg="#34D399"
          icon={<Check size={15} strokeWidth={2.2} />}
        />
        <StatCard
          label="Open alerts"
          value={dashboardData?.alerts}
          delta={dashboardData?.criticalAlerts > 0 ? `${dashboardData?.criticalAlerts} critical` : "No critical alerts"}
          deltaColor={dashboardData?.criticalAlerts > 0 ? "#DC2626" : "#A78BFA"}
          iconBg="#A78BFA"
          icon={<Bell size={15} strokeWidth={2} />}
        />
      </div>

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
    <div className="flex flex-col gap-[18px] animate-pulse">
      <div className="grid grid-cols-4 gap-[14px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[108px] rounded-[14px] bg-hover" />
        ))}
      </div>
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="h-[320px] rounded-[14px] bg-hover" />
        <div className="h-[320px] rounded-[14px] bg-hover" />
      </div>
    </div>
  )
}
