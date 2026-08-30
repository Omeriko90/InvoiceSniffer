// Client component by import — only ever rendered from <DashboardPage>.
import type { ReactNode } from "react"
import { FileText, Receipt, Wallet, Percent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fmtMoneyWhole as fmtMoney } from "@/lib/money"
import type { CurrencyTotal, TaxByCurrency } from "@/api-types/dashboard"

// Render a per-currency total as a headline figure + a note when more than one
// currency is present (we never sum across currencies).
function money(rows: (CurrencyTotal | TaxByCurrency)[]): { value: string; note: string } {
  if (rows.length === 0) return { value: "—", note: "nothing yet" }
  const [main, ...rest] = rows
  return {
    value: fmtMoney(main.total, main.currency),
    note: rest.length > 0 ? `+ ${rest.length} more ${rest.length === 1 ? "currency" : "currencies"}` : main.currency,
  }
}

export function OverviewStatRow({
  invoiceCount,
  receiptCount,
  totalSpend,
  reclaimableVat,
  rangeLabel,
}: {
  invoiceCount: number
  receiptCount: number
  totalSpend: CurrencyTotal[]
  reclaimableVat: TaxByCurrency[]
  rangeLabel: string
}) {
  const spend = money(totalSpend)
  const tax = money(reclaimableVat)

  return (
    <div className="grid grid-cols-4 gap-3.5">
      <OverviewCard
        label="Invoices"
        value={String(invoiceCount)}
        note={rangeLabel}
        noteClass="text-text-secondary"
        iconBgClass="bg-info"
        icon={<FileText size={15} strokeWidth={2} />}
      />
      <OverviewCard
        label="Receipts"
        value={String(receiptCount)}
        note={rangeLabel}
        noteClass="text-text-secondary"
        iconBgClass="bg-success"
        icon={<Receipt size={15} strokeWidth={2} />}
      />
      <OverviewCard
        label="Total spend"
        value={spend.value}
        note={spend.note}
        noteClass="text-text-secondary"
        iconBgClass="bg-primary"
        icon={<Wallet size={15} strokeWidth={2} />}
      />
      <OverviewCard
        label="Reclaimable VAT"
        value={tax.value}
        note={rangeLabel}
        noteClass="text-text-secondary"
        iconBgClass="bg-purple"
        icon={<Percent size={15} strokeWidth={2} />}
      />
    </div>
  )
}

function OverviewCard({
  label,
  value,
  note,
  noteClass,
  iconBgClass,
  icon,
}: {
  label: string
  value: string
  note: string
  noteClass: string
  iconBgClass: string
  icon: ReactNode
}) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-[18px]">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-semibold text-text-secondary leading-tight">{label}</span>
          <div className={cn("w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 text-white", iconBgClass)}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-extrabold text-heading leading-none tracking-tight mt-2 tabular-nums truncate">{value}</p>
        <p className={cn("text-xs font-semibold mt-1.5 leading-tight", noteClass)}>{note}</p>
      </CardContent>
    </Card>
  )
}
