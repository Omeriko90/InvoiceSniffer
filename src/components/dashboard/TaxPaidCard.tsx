// Client component by import — only ever rendered from <DashboardPage>.
import { Card, CardContent } from "@/components/ui/card"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import type { TaxByCurrency } from "@/api-types/dashboard"

export function TaxPaidCard({ rows, monthLabel }: { rows: TaxByCurrency[]; monthLabel: string }) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-heading leading-none">
            Tax paid — {monthLabel}
          </h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">
            No tax recorded on this month&apos;s invoices.
          </p>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {rows.map((r) => (
              <div key={r.currency} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-[8px] min-w-0">
                  <span className="text-sm font-semibold text-heading">
                    {r.currency}
                  </span>
                  <span className="text-xs text-text-secondary shrink-0">
                    · {r.count} {r.count === 1 ? "invoice" : "invoices"}
                  </span>
                </span>
                <span className="text-base font-extrabold text-heading shrink-0 tabular-nums">
                  {fmtMoney(r.total, r.currency)}
                </span>
              </div>
            ))}
            <p className="text-xs text-dim leading-snug pt-1">
              Reclaimable VAT from tax invoices this month. Not a
              guaranteed-complete total.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
