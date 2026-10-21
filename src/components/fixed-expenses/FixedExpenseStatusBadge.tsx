// Client component by import — only ever rendered from <FixedExpensesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { useT } from "@/components/i18n/LocaleProvider"
import { PERIOD_STATUS_META } from "@/lib/fixed-expense-meta"
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
  const t = useT()
  const meta = PERIOD_STATUS_META[status]
  const headlineLabels: Record<FixedExpensePeriodStatus, string> = {
    ARRIVED: t("fixed_expenses.status.arrived"),
    PENDING: t("fixed_expenses.status.pending"),
    OVERDUE: t("fixed_expenses.status.overdue"),
  }
  const timelineLabels: Record<FixedExpensePeriodStatus, string> = {
    ARRIVED: t("fixed_expenses.status.arrived"),
    PENDING: t("fixed_expenses.status.pending"),
    OVERDUE: t("fixed_expenses.status.missing"),
  }
  const label = (variant === "timeline" ? timelineLabels : headlineLabels)[status]
  return (
    <StatusPill bg={meta.bg} color={meta.color}>
      {label}
    </StatusPill>
  )
}
