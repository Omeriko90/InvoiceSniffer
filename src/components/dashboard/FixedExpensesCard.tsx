"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, AlertTriangle, Repeat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleChip } from "@/components/ui/toggle-chip"
import { fmtAmount } from "@/components/invoices/helpers"
import { FixedExpenseStatusBadge } from "@/components/fixed-expenses/FixedExpenseStatusBadge"
import { FixedExpenseDetailDrawer } from "@/components/fixed-expenses/FixedExpenseDetailDrawer"
import { useDashboardFixedExpenses } from "@/hooks/useDashboardFixedExpenses"
import type { FixedExpensePeriodStatus } from "@/lib/fixed-expenses"
import type { DashboardFixedExpense } from "@/api-types/dashboard"

const GRID = "1.7fr 1.3fr 0.9fr auto"

type StatusFilter = "all" | FixedExpensePeriodStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
]

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function FixedExpensesCard({
  range,
  rangeLabel,
}: {
  range: { from: string; to: string } | null
  rangeLabel: string
}) {
  const router = useRouter()
  const { data, isPending } = useDashboardFixedExpenses(range)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selected, setSelected] = useState<DashboardFixedExpense | null>(null)
  const q = useDebounced(search.toLowerCase(), 250)

  const expenses = data?.expenses ?? []

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.vendorName.some((v) => v.toLowerCase().includes(q)) ||
        e.senderEmail.some((s) => s.toLowerCase().includes(q))
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "OVERDUE"
          ? e.rangeStats.overdueCount > 0
          : e.rangeStats.latestStatus === statusFilter)
      return matchSearch && matchStatus
    })
  }, [expenses, q, statusFilter])

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-heading leading-none">Fixed expenses</h2>
          <span className="text-xs text-text-secondary shrink-0">{rangeLabel}</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-[320px]">
            <Search
              size={15}
              strokeWidth={1.8}
              className="absolute start-2.75 top-1/2 -translate-y-1/2 text-dim"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="h-auto ps-8.5 pe-2.75 py-2 text-sm border-border rounded-lg bg-surface"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <ToggleChip
                key={f.value}
                active={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </ToggleChip>
            ))}
          </div>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg bg-hover" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyNone onManage={() => router.push("/fixed-expenses")} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            No fixed expenses match your search or filter.
          </p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div
              className="grid px-4 py-2.5 bg-background border-b border-border"
              style={{ gridTemplateColumns: GRID, gap: "12px" }}
            >
              {["Name", "Source", "Arrived", "Latest period"].map((h) => (
                <span key={h} className="text-xs font-bold text-text-secondary">
                  {h}
                </span>
              ))}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {filtered.map((e) => (
                <Button
                  key={e.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelected(e)}
                  className="grid w-full h-auto justify-normal rounded-none items-center px-4 py-3 border-b border-hover last:border-b-0 text-left hover:bg-hover transition-colors"
                  style={{ gridTemplateColumns: GRID, gap: "12px" }}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-heading truncate">
                      {e.name}
                    </span>
                    {e.expectedAmount && (
                      <span className="block text-xs text-text-secondary">
                        {fmtAmount(e.expectedAmount, e.currency)}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-text-secondary truncate">
                    {e.vendorName[0] ?? e.senderEmail[0] ?? "—"}
                  </span>
                  <span className="text-sm text-text-primary tabular-nums">
                    {e.rangeStats.arrivedCount}/{e.rangeStats.totalCount}
                  </span>
                  <span className="flex items-center justify-end gap-2 min-w-0">
                    {e.rangeStats.overdueCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg text-danger-fg text-[11px] font-bold px-2 py-0.5">
                        <AlertTriangle size={12} strokeWidth={2.2} />
                        {e.rangeStats.overdueCount} overdue
                      </span>
                    )}
                    <FixedExpenseStatusBadge status={e.rangeStats.latestStatus} />
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <FixedExpenseDetailDrawer
            key={selected.id}
            expense={selected}
            onEdit={() => router.push("/fixed-expenses")}
            onDismiss={() => setSelected(null)}
          />
        )}
      </Sheet>
    </Card>
  )
}

function EmptyNone({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-11 h-11 rounded-lg bg-info-bg flex items-center justify-center mb-3">
        <Repeat size={19} strokeWidth={1.8} className="text-primary" />
      </div>
      <p className="text-sm font-bold text-heading mb-1">No fixed expenses in this range</p>
      <p className="text-sm text-text-secondary max-w-80 mb-4">
        Track recurring bills and we&apos;ll tell you each period whether their invoice has arrived.
      </p>
      <Button onClick={onManage}>Manage fixed expenses</Button>
    </div>
  )
}
