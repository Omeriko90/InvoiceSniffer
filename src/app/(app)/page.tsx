"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"
import { OverviewStatRow } from "@/components/dashboard/OverviewStatRow"
import { SpendPieChart } from "@/components/dashboard/SpendPieChart"
import { TaxPaidCard } from "@/components/dashboard/TaxPaidCard"
import { TopVendorsCard } from "@/components/dashboard/TopVendorsCard"
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
    <div className="flex flex-col gap-[18px]">
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

          <div className="grid gap-3.5" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <SpendPieChart rows={data.spendByCategory} rangeLabel={rangeLabel} />
            <TaxPaidCard rows={data.reclaimableVat} rangeLabel={rangeLabel} />
          </div>

          <TopVendorsCard rows={data.topVendors} rangeLabel={rangeLabel} />
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
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-[14px] bg-hover" />
        ))}
      </div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Skeleton className="h-80 rounded-[14px] bg-hover" />
        <Skeleton className="h-80 rounded-[14px] bg-hover" />
      </div>
    </div>
  )
}
