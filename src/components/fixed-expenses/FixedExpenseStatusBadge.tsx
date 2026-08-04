// Client component by import — only ever rendered from <FixedExpensesClient>.
import { Badge } from "@/components/ui/badge"
import {
  PERIOD_STATUS_META,
  PERIOD_STATUS_LABELS,
  TIMELINE_STATUS_LABELS,
} from "@/lib/fixed-expense-meta"
import type { FixedExpensePeriodStatus } from "@/lib/fixed-expenses"

// Arrival-status pill. `variant="headline"` (row/header) labels OVERDUE as
// "Overdue"; `variant="timeline"` (per-period rows) labels it "Missing".
export function FixedExpenseStatusBadge({
  status,
  variant = "headline",
}: {
  status: FixedExpensePeriodStatus
  variant?: "headline" | "timeline"
}) {
  const meta = PERIOD_STATUS_META[status]
  const label = (variant === "timeline" ? TIMELINE_STATUS_LABELS : PERIOD_STATUS_LABELS)[status]
  return (
    <Badge
      className="rounded-full h-auto text-[11.5px] font-[700] px-[10px] py-[2px]"
      style={{ background: meta.bg, color: meta.color }}
    >
      {label}
    </Badge>
  )
}
