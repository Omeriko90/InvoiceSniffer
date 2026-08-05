// Client component by import — only ever rendered from <DashboardPage>.
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/invoice-categories"
import type { CategorySpend as CategorySpendRow } from "@/api-types/dashboard"

export function CategorySpend({ rows, monthLabel }: { rows: CategorySpendRow[]; monthLabel: string }) {
  // The largest row anchors the proportional bars.
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-heading leading-none">
            Spend by category — {monthLabel}
          </h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">
            No categorized spend yet this month.
          </p>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {rows.map((r) => {
              const meta = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.UNCATEGORIZED
              return (
                <div key={`${r.category}-${r.currency}`} className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-[8px] min-w-0">
                      <span
                        className="w-[10px] h-[10px] rounded-full shrink-0"
                        style={{ background: meta.color }}
                      />
                      <span className="text-sm font-semibold text-heading truncate">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                      <span className="text-xs text-text-secondary shrink-0">
                        · {r.count}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-heading shrink-0">
                      {fmtMoney(r.total, r.currency)}
                    </span>
                  </div>
                  <div className="h-[6px] rounded-full bg-hover overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(4, (r.total / max) * 100)}%`, background: meta.color }}
                    />
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
