import Link from "next/link"
import { AlertCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RecStats {
  total: number
  matched: number
  possible: number
  missing: number
  noInvoice: number
}

interface ReconciliationCardProps {
  monthLabel: string
  rec: RecStats
  possibleCount: number
  unmatchedCount: number
}

const LEGEND = [
  { label: "Matched",    key: "matched"   as const, color: "#34D399" },
  { label: "Possible",   key: "possible"  as const, color: "#FBBF24" },
  { label: "Missing",    key: "missing"   as const, color: "#FB7171" },
  { label: "No invoice", key: "noInvoice" as const, color: "#CBD5E1" },
]

export function ReconciliationCard({ monthLabel, rec, possibleCount, unmatchedCount }: ReconciliationCardProps) {
  const pct = (n: number) => `${Math.round((n / rec.total) * 100)}%`

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-[700] text-heading leading-none">
            Reconciliation status — {monthLabel}
          </h2>
          <Link href="/reconcile" className="text-[13px] font-[600] text-primary hover:opacity-75 transition-opacity">
            Review →
          </Link>
        </div>

        {/* Progress bar */}
        <div className="h-[14px] rounded-full overflow-hidden flex">
          {rec.matched   > 0 && <div style={{ width: pct(rec.matched),   background: "#34D399", flex: "none" }} />}
          {rec.possible  > 0 && <div style={{ width: pct(rec.possible),  background: "#FBBF24", flex: "none" }} />}
          {rec.missing   > 0 && <div style={{ width: pct(rec.missing),   background: "#FB7171", flex: "none" }} />}
          {rec.noInvoice > 0 && <div style={{ width: pct(rec.noInvoice), background: "#CBD5E1", flex: "none" }} />}
          {rec.total === 1   && <div className="flex-1" style={{ background: "#E8EDFA" }} />}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-3">
          {LEGEND.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-1.5 mb-[3px]">
                <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-[12.5px] text-text-secondary">{item.label}</span>
              </div>
              <span className="text-[20px] font-[700] text-heading leading-none pl-[17px]">{rec[item.key]}</span>
            </div>
          ))}
        </div>

        {/* Needs attention */}
        <div className="flex flex-col gap-2 border-t border-border pt-[18px]">
          <p className="text-[12.5px] font-[700] text-text-secondary uppercase tracking-[0.04em] mb-[2px]">
            Needs your attention
          </p>

          {possibleCount > 0 && (
            <Link
              href="/reconcile"
              className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border transition-all hover:brightness-[0.98]"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
            >
              <AlertCircle size={18} strokeWidth={2} color="#B45309" className="shrink-0" />
              <span className="flex-1 text-[13.5px] text-[#78350F]">
                <strong>{possibleCount} possible matches</strong> waiting for confirmation
              </span>
              <span className="text-[13px] font-[700] text-[#B45309] shrink-0">Review →</span>
            </Link>
          )}

          {unmatchedCount > 0 && (
            <Link
              href="/reconcile"
              className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border transition-all hover:brightness-[0.98]"
              style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
            >
              <XCircle size={18} strokeWidth={2} color="#DC2626" className="shrink-0" />
              <span className="flex-1 text-[13.5px] text-[#7F1D1D]">
                <strong>{unmatchedCount} transactions</strong> with no matching invoice
              </span>
              <span className="text-[13px] font-[700] text-[#DC2626] shrink-0">Review →</span>
            </Link>
          )}

          {possibleCount === 0 && unmatchedCount === 0 && (
            <div
              className="flex items-center gap-2 px-3 py-[11px] rounded-[10px] border border-[#BBF7D0] text-[13px] font-[500] text-[#059669]"
              style={{ background: "#ECFDF5" }}
            >
              <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              All transactions reconciled
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
