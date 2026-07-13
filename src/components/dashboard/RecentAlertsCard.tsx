import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ALERT_META, alertDescription } from "@/lib/alert-helpers"
import type { AlertItem } from "@/types/alert"

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
            {alerts.map((alert) => {
              const meta   = ALERT_META[alert.type] ?? { label: alert.type, color: "#94A3B8", bg: "#F1F3F8" }
              const vendor = alert.invoice?.vendorName ?? alert.vendorName
              return (
                <div key={alert.id} className="flex gap-[11px] py-[11px] border-b border-[#F1F3F8] last:border-0">
                  <span className="w-[9px] h-[9px] rounded-full mt-[5px] shrink-0" style={{ background: meta.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap leading-none mb-[3px]">
                      <span className="text-[13.5px] font-[600] text-heading">{vendor}</span>
                      <Badge
                        className="h-auto rounded-full text-[10px] font-[700] px-[7px] py-[1.5px] shrink-0"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-[12.5px] text-text-secondary line-clamp-1 leading-[1.5]">
                      {alertDescription(alert.type, alert.details)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
