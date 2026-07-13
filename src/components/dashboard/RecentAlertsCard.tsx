import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { AlertItem } from "@/types/alert"
import { AlertListItem } from "@/components/dashboard/AlertListItem"

interface RecentAlertsCardProps {
  alerts: AlertItem[]
}

export function RecentAlertsCard({ alerts }: RecentAlertsCardProps) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">

        <div className="flex items-center justify-between mb-[14px]">
          <h2 className="text-[16px] font-[700] text-heading leading-none">Recent alerts</h2>
          <Link href="/alerts" className="text-[13px] font-[600] text-primary hover:opacity-75 transition-opacity">
            All →
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-text-secondary">
            No active alerts
          </div>
        ) : (
          <div className="flex flex-col">
            {alerts.map((alert) => (
              <AlertListItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
