// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react"
import { format as formatDate } from "date-fns"
import type { DateRange } from "react-day-picker"
import { FormDialog } from "@/components/ui/form-dialog"
import { Button } from "@/components/ui/components/buttons"
import { Calendar } from "@/components/ui/calendar"
import { isPreset, type InvoiceDateScope } from "@/lib/invoice-date-filter"

// Custom date-range picker. Seeded from the current scope when it's already a
// custom range; presets start with an empty selection. Apply commits an ISO
// {from,to} scope; Cancel leaves the existing scope untouched.
export function DateRangeDialog({
  scope,
  onApply,
  onClose,
}: {
  scope: InvoiceDateScope
  onApply: (scope: { from: string; to: string }) => void
  onClose: () => void
}) {
  const [range, setRange] = useState<DateRange | undefined>(() =>
    isPreset(scope)
      ? undefined
      : { from: new Date(scope.from), to: new Date(scope.to) }
  )

  const canApply = !!range?.from && !!range?.to

  function apply() {
    if (!range?.from || !range?.to) return
    onApply({
      from: formatDate(range.from, "yyyy-MM-dd"),
      to: formatDate(range.to, "yyyy-MM-dd"),
    })
  }

  return (
    <FormDialog
      className="sm:max-w-[420px]"
      footerClassName="gap-[8px]"
      title="Custom date range"
      description={
        canApply
          ? `${formatDate(range!.from!, "d MMM yyyy")} – ${formatDate(range!.to!, "d MMM yyyy")}`
          : "Pick a start and end day."
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-auto py-[8px] rounded-[10px] border-border bg-surface text-[13px] font-[600] text-text-primary"
          >
            Cancel
          </Button>
          <Button
            onClick={apply}
            disabled={!canApply}
            className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600]"
          >
            Apply
          </Button>
        </>
      }
    >
      <div className="px-[10px] py-[8px] flex justify-center">
        <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} />
      </div>
    </FormDialog>
  )
}
