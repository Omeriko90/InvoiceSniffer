// Client component by import — only ever rendered from <DashboardPage>.
import { Card, CardContent } from "@/components/ui/card"
import type { TaxByCurrency } from "@/api-types/dashboard"

function fmtMoney(total: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(total)
  } catch {
    return `${total.toFixed(0)} ${currency}`
  }
}

export function TaxPaidCard({ rows, monthLabel }: { rows: TaxByCurrency[]; monthLabel: string }) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-[700] text-heading leading-none">
            Tax paid — {monthLabel}
          </h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-[13px] text-text-secondary py-6 text-center">
            No tax recorded on this month&apos;s invoices.
          </p>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {rows.map((r) => (
              <div key={r.currency} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-[8px] min-w-0">
                  <span className="text-[13px] font-[600] text-heading">
                    {r.currency}
                  </span>
                  <span className="text-[12px] text-text-secondary shrink-0">
                    · {r.count} {r.count === 1 ? "invoice" : "invoices"}
                  </span>
                </span>
                <span className="text-[15px] font-[800] text-heading shrink-0 tabular-nums">
                  {fmtMoney(r.total, r.currency)}
                </span>
              </div>
            ))}
            <p className="text-[11.5px] text-dim leading-snug pt-1">
              Reclaimable VAT from tax invoices this month. Not a
              guaranteed-complete total.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
