// Client component by import — only ever rendered from <DashboardPage>.
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import type { SpendTrend } from "@/api-types/dashboard"

// Spend bucketed by month across the selected range.
export function SpendTrendCard({ trend, rangeLabel }: { trend: SpendTrend | null; rangeLabel: string }) {
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
          <h2 className="text-base font-bold text-heading leading-none">Spend by month</h2>
          <span className="text-xs text-text-secondary shrink-0">{rangeLabel}</span>
        </div>

        {!hasSpend ? (
          <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary">
            No spend in this range.
          </p>
        ) : (
          <div className="flex-1 min-h-[148px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  dy={4}
                />
                <Tooltip
                  cursor={false}
                  formatter={(value) => [fmtMoney(Number(value ?? 0), trend!.currency), "Spend"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E8EDFA",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="#7AA7FF" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
