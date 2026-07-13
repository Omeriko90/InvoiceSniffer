import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { RecStats } from "@/components/dashboard/types"
import { StatusBar } from "@/components/dashboard/StatusBar"
import { LegendGrid } from "@/components/dashboard/LegendGrid"
import { NeedsAttention } from "@/components/dashboard/NeedsAttention"

interface ReconciliationCardProps {
  monthLabel: string
  rec: RecStats
  possibleCount: number
  unmatchedCount: number
}

export function ReconciliationCard({ monthLabel, rec, possibleCount, unmatchedCount }: ReconciliationCardProps) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-[700] text-heading leading-none">
            Reconciliation status — {monthLabel}
          </h2>
          <Link href="/reconcile" className="text-[13px] font-[600] text-primary hover:opacity-75 transition-opacity">
            Review →
          </Link>
        </div>

        {/* Progress bar */}
        <StatusBar rec={rec} />

        {/* Legend */}
        <LegendGrid rec={rec} />

        {/* Needs attention */}
        <NeedsAttention possibleCount={possibleCount} unmatchedCount={unmatchedCount} />

      </CardContent>
    </Card>
  )
}
