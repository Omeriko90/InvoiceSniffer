// Client component by import — only ever rendered from <ReconcileSession>.
import type { MatchSummary } from "@/api-types/reconcile"

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex-1 min-w-[130px] bg-card border border-border rounded-lg px-[16px] py-[13px]">
      <p className="text-[24px] font-[800] leading-none" style={{ color: tone }}>
        {value}
      </p>
      <p className="text-[12px] text-text-secondary mt-[6px]">{label}</p>
    </div>
  )
}

export function ReconcileSummary({ summary }: { summary: MatchSummary }) {
  return (
    <div className="flex flex-wrap gap-[10px]">
      <Stat value={summary.matched} label="Matched" tone="#059669" />
      <Stat value={summary.possible} label="Possible matches" tone="#B45309" />
      <Stat value={summary.chargesMissingInvoice} label="Charges missing an invoice" tone="#DC2626" />
      <Stat value={summary.invoicesMissingCharge} label="Invoices missing a charge" tone="#2563EB" />
      {summary.collisions > 0 && (
        <Stat value={summary.collisions} label="Already reconciled" tone="#B45309" />
      )}
    </div>
  )
}
