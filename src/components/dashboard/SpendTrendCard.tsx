// Client component by import — only ever rendered from <DashboardPage>.
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import type { SpendTrend } from "@/api-types/dashboard"

// Monthly spend over a fixed trailing window. Independent of the selected range,
// so it reads as a steady momentum view next to the (range-scoped) vendor list.
export function SpendTrendCard({ trend }: { trend: SpendTrend | null }) {
  const data =
    trend?.points.map((p) => ({
      label: format(new Date(p.month), "MMM"),
      total: p.total,
      currency: trend.currency,
    })) ?? []
  const hasSpend = data.some((d) => d.total > 0)

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-heading leading-none">Spend over time</h2>
          <span className="text-xs text-text-secondary shrink-0">Last 6 months</span>
        </div>

        {!hasSpend ? (
          <p className="text-sm text-text-secondary py-10 text-center">
            No spend in the last 6 months.
          </p>
        ) : (
          <div className="h-[168px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  dy={4}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-hover)" }}
                  formatter={(value) => [fmtMoney(Number(value ?? 0), trend!.currency), "Spend"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
