// Client component by import — only ever rendered from <DashboardPage>.
import { X, Clock, Check, Bell } from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"

interface StatRowProps {
  unmatched: number
  possible: number
  matched: number
  matchedDelta: number
  alerts: number
  criticalAlerts: number
}

export function StatRow({ unmatched, possible, matched, matchedDelta, alerts, criticalAlerts }: StatRowProps) {
  return (
    <div className="grid grid-cols-4 gap-[14px]">
      <StatCard
        label="Unmatched"
        value={unmatched}
        delta="needs review"
        deltaColor="#FB7171"
        iconBg="#FB7171"
        icon={<X size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Possible matches"
        value={possible}
        delta="awaiting confirm"
        deltaColor="#B45309"
        iconBg="#FBBF24"
        icon={<Clock size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Matched this month"
        value={matched}
        delta={matchedDelta >= 0 ? `+${matchedDelta} this week` : `${matchedDelta} vs last month`}
        deltaColor="#059669"
        iconBg="#34D399"
        icon={<Check size={15} strokeWidth={2.2} />}
      />
      <StatCard
        label="Open alerts"
        value={alerts}
        delta={criticalAlerts > 0 ? `${criticalAlerts} critical` : "No critical alerts"}
        deltaColor={criticalAlerts > 0 ? "#DC2626" : "#A78BFA"}
        iconBg="#A78BFA"
        icon={<Bell size={15} strokeWidth={2} />}
      />
    </div>
  )
}
