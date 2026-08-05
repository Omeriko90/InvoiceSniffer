// Client component by import — only ever rendered from <ReconcileSession>.
import { cn } from "@/lib/utils"
import type { MatchSummary } from "@/api-types/reconcile"

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex-1 min-w-[130px] bg-card border border-border rounded-lg px-4 py-[13px]">
      <p className={cn("text-2xl font-extrabold leading-none", tone)}>
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-1.5">{label}</p>
    </div>
  )
}

export function ReconcileSummary({ summary }: { summary: MatchSummary }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <Stat value={summary.matched} label="Matched" tone="text-success-fg" />
      <Stat value={summary.possible} label="Possible matches" tone="text-warning-fg" />
      <Stat value={summary.chargesMissingInvoice} label="Charges missing an invoice" tone="text-danger-fg" />
      <Stat value={summary.invoicesMissingCharge} label="Invoices missing a charge" tone="text-info-fg" />
      {summary.collisions > 0 && (
        <Stat value={summary.collisions} label="Already reconciled" tone="text-warning-fg" />
      )}
    </div>
  )
}
