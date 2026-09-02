// Client component by import — only ever rendered from <DashboardPage>.
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import type { TopVendor } from "@/api-types/dashboard"

export function TopVendorsCard({ rows, rangeLabel }: { rows: TopVendor[]; rangeLabel: string }) {
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-heading leading-none">Top vendors</h2>
          <span className="text-xs text-text-secondary shrink-0">{rangeLabel}</span>
        </div>

        {rows.length === 0 ? (
          <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary">
            No spend in this range.
          </p>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-3.5">
            {rows.map((r) => (
              <div key={`${r.vendor}-${r.currency}`} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-heading truncate">{r.vendor}</span>
                  <span className="text-sm font-bold text-heading shrink-0 tabular-nums">
                    {fmtMoney(r.total, r.currency)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, (r.total / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
