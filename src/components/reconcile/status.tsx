import { Badge } from "@/components/ui/badge"
import { useT } from "@/components/i18n/LocaleProvider"
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
  MATCHED:    { label: "Matched",    badge: "bg-success-bg text-success-fg",  bar: "bg-success" },
  POSSIBLE:   { label: "Possible",   badge: "bg-warning-bg text-warning-fg",  bar: "bg-warning" },
  UNMATCHED:  { label: "Missing",    badge: "bg-danger-bg text-danger-fg",   bar: "bg-danger" },
  NO_INVOICE: { label: "No invoice", badge: "bg-hover text-text-secondary",  bar: "bg-faint" },
} as const satisfies Record<TxnStatus, StatusMeta>

// Status labels resolved via i18n; STATUS_META.label kept as a non-visible fallback.
const STATUS_LABEL_KEYS: Record<TxnStatus, string> = {
  MATCHED: "reconcile.status.matched",
  POSSIBLE: "reconcile.status.possible",
  UNMATCHED: "reconcile.status.missing",
  NO_INVOICE: "reconcile.status.noInvoice",
}

export function StatusBadge({
  status,
  confirmed,
  className,
}: {
  status: TxnStatus
  confirmed?: boolean
  className?: string
}) {
  const t = useT()
  const meta = STATUS_META[status]
  const label =
    confirmed && status === "MATCHED"
      ? t("reconcile.status.confirmed")
      : t(STATUS_LABEL_KEYS[status] as never)
  return (
    <Badge className={cn("h-auto text-xs font-bold px-2.5 py-0.5", meta.badge, className)}>
      {label}
    </Badge>
  )
}
