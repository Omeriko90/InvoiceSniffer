// Client component by import — only ever rendered from <DashboardPage>.
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/invoice-categories"
import type { CategorySpend } from "@/api-types/dashboard"

// Spend-by-category donut. Rows arrive per (category, currency); we never sum
// across currencies, so the chart renders the currency with the most spend and
// notes when others exist.
export function SpendPieChart({ rows, rangeLabel }: { rows: CategorySpend[]; rangeLabel: string }) {
  // Pick the dominant currency by total spend.
  const byCurrency = new Map<string, number>()
  for (const r of rows) byCurrency.set(r.currency, (byCurrency.get(r.currency) ?? 0) + r.total)
  const currencies = Array.from(byCurrency.entries()).sort((a, b) => b[1] - a[1])
  const primary = currencies[0]?.[0]

  const slices = rows
    .filter((r) => r.currency === primary && r.total > 0)
    .map((r) => ({
      key: r.category,
      name: CATEGORY_LABELS[r.category] ?? r.category,
      value: r.total,
      color: (CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.UNCATEGORIZED).color,
      currency: r.currency,
    }))
    .sort((a, b) => b.value - a.value)

  const total = slices.reduce((s, d) => s + d.value, 0)

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0] h-[264px]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-heading leading-none">Spend by category</h2>
          <span className="text-xs text-text-secondary shrink-0">{rangeLabel}</span>
        </div>

        {slices.length === 0 ? (
          <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary">
            No categorized spend in this range.
          </p>
        ) : (
          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative w-[168px] h-[168px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [fmtMoney(Number(value ?? 0), primary), String(name)]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-semibold text-text-secondary leading-none">Total</span>
                <span className="text-sm font-extrabold text-heading leading-tight mt-1 tabular-nums">
                  {fmtMoney(total, primary)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {slices.map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-sm font-semibold text-heading truncate">{d.name}</span>
                  </span>
                  <span className="text-sm font-bold text-heading shrink-0 tabular-nums">
                    {fmtMoney(d.value, d.currency)}
                  </span>
                </div>
              ))}
              {currencies.length > 1 && (
                <p className="text-xs text-dim pt-1">
                  Showing {primary}. {currencies.length - 1} other{" "}
                  {currencies.length - 1 === 1 ? "currency" : "currencies"} not shown.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
