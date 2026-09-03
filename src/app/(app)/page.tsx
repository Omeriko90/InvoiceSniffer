"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"
import { OverviewStatRow } from "@/components/dashboard/OverviewStatRow"
import { SpendPieChart } from "@/components/dashboard/SpendPieChart"
import { TaxPaidCard } from "@/components/dashboard/TaxPaidCard"
import { TopVendorsCard } from "@/components/dashboard/TopVendorsCard"
import { SpendTrendCard } from "@/components/dashboard/SpendTrendCard"
import { DashboardDateRange } from "@/components/dashboard/DashboardDateRange"
import { resolveDateRange } from "@/lib/date-range"
import { isDashboardPreset, type DashboardScope } from "@/lib/dashboard-range"

export default function DashboardPage() {
  const [scope, setScope] = useState<DashboardScope>({ preset: "mtd" })

  // Resolve the scope to a concrete ISO window. Null while a custom range is
  // still being filled in — the query stays disabled until then.
  const range = useMemo(() => {
    try {
      if (!isDashboardPreset(scope) && (!scope.from || !scope.to)) return null
      const { from, to } = resolveDateRange(scope, new Date())
      return { from: from.toISOString(), to: to.toISOString() }
    } catch {
      return null
    }
  }, [scope])

  // Summary boxes always show the concrete window as month names; the preset
  // *name* lives only on the chips (see DashboardDateRange).
  const rangeLabel = range ? monthRangeLabel(range.from, range.to) : "Custom range"

  const { data, isPending } = useDashboard(range)

  return (
    <div className="flex flex-col gap-[18px] md:h-full md:min-h-0">
      <DashboardDateRange scope={scope} onChange={setScope} />

      {range === null ? (
        <p className="text-sm text-text-secondary py-10 text-center">
          Pick a start and end date to see your overview.
        </p>
      ) : isPending || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <OverviewStatRow
            invoiceCount={data.invoiceCount}
            receiptCount={data.receiptCount}
            totalSpend={data.totalSpend}
            reclaimableVat={data.reclaimableVat}
            rangeLabel={rangeLabel}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:flex-1 md:min-h-0 md:auto-rows-fr">
            <SpendPieChart rows={data.spendByCategory} rangeLabel={rangeLabel} />
            <SpendTrendCard trend={data.spendTrend} rangeLabel={rangeLabel} />
            <TopVendorsCard rows={data.topVendors} rangeLabel={rangeLabel} />
            <TaxPaidCard rows={data.reclaimableVat} rangeLabel={rangeLabel} />
          </div>
        </>
      )}
    </div>
  )
}

// Compact month-granularity window label: "August", "June – August" within a
// year, or "Dec 2025 – Feb 2026" across years.
function monthRangeLabel(fromISO: string, toISO: string): string {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  const sameYear = from.getFullYear() === to.getFullYear()
  const sameMonth = sameYear && from.getMonth() === to.getMonth()
  if (sameMonth) return format(from, "MMMM yyyy")
  if (sameYear) return `${format(from, "MMMM")} – ${format(to, "MMMM yyyy")}`
  return `${format(from, "MMM yyyy")} – ${format(to, "MMM yyyy")}`
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] md:h-full md:min-h-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-[14px] bg-hover" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:flex-1 md:min-h-0 md:auto-rows-fr">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 md:h-auto rounded-[14px] bg-hover" />
        ))}
      </div>
    </div>
  )
}
