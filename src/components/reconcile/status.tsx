import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Single source of truth for transaction reconcile statuses.
export type TxnStatus = "UNMATCHED" | "POSSIBLE" | "MATCHED" | "NO_INVOICE"

type StatusMeta = {
  label: string
  /** Badge background + text, token-based where a token exists. */
  badge: string
  /** Confidence-bar fill color token. */
  bar: string
}

export const STATUS_META = {
  MATCHED:    { label: "Matched",    badge: "bg-success-bg text-[#059669]",  bar: "bg-success" },
  POSSIBLE:   { label: "Possible",   badge: "bg-warning-bg text-[#B45309]",  bar: "bg-warning" },
  UNMATCHED:  { label: "Missing",    badge: "bg-danger-bg text-[#DC2626]",   bar: "bg-danger" },
  NO_INVOICE: { label: "No invoice", badge: "bg-hover text-text-secondary",  bar: "bg-faint" },
} as const satisfies Record<TxnStatus, StatusMeta>

export function StatusBadge({
  status,
  confirmed,
  className,
}: {
  status: TxnStatus
  confirmed?: boolean
  className?: string
}) {
  const meta = STATUS_META[status]
  const label = confirmed && status === "MATCHED" ? "Confirmed" : meta.label
  return (
    <Badge className={cn("h-auto text-xs font-bold px-[10px] py-[2px]", meta.badge, className)}>
      {label}
    </Badge>
  )
}
