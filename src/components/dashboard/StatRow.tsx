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
    <div className="grid grid-cols-4 gap-3.5">
      <StatCard
        label="Unmatched"
        value={unmatched}
        delta="needs review"
        deltaClass="text-danger"
        iconBgClass="bg-danger"
        icon={<X size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Possible matches"
        value={possible}
        delta="awaiting confirm"
        deltaClass="text-warning-fg"
        iconBgClass="bg-warning"
        icon={<Clock size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Matched this month"
        value={matched}
        delta={matchedDelta >= 0 ? `+${matchedDelta} this week` : `${matchedDelta} vs last month`}
        deltaClass="text-success-fg"
        iconBgClass="bg-success"
        icon={<Check size={15} strokeWidth={2.2} />}
      />
      <StatCard
        label="Open alerts"
        value={alerts}
        delta={criticalAlerts > 0 ? `${criticalAlerts} critical` : "No critical alerts"}
        deltaClass={criticalAlerts > 0 ? "text-danger-fg" : "text-purple"}
        iconBgClass="bg-purple"
        icon={<Bell size={15} strokeWidth={2} />}
      />
    </div>
  )
}
