// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react"
import { format as formatDate } from "date-fns"
import type { DateRange } from "react-day-picker"
import { FormDialog } from "@/components/ui/form-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { isPreset, type InvoiceDateScope } from "@/lib/invoice-date-filter"
import { useT } from "@/components/i18n/LocaleProvider"

export function DateRangeDialog({
  scope,
  onApply,
  onClose,
}: {
  scope: InvoiceDateScope
  onApply: (scope: { from: string; to: string }) => void
  onClose: () => void
}) {
  const t = useT()
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
      className="sm:max-w-105"
      footerClassName="gap-[8px]"
      title={t("invoices.dateRange.title")}
      description={
        canApply
          ? `${formatDate(range!.from!, "d MMM yyyy")} – ${formatDate(range!.to!, "d MMM yyyy")}`
          : t("invoices.dateRange.pickPrompt")
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("invoices.actions.cancel")}
          </Button>
          <Button onClick={apply} disabled={!canApply}>
          {t("invoices.dateRange.apply")}
          </Button>
        </>
      }
    >
      <div className="px-2.5 py-2 flex justify-center">
        <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} />
      </div>
    </FormDialog>
  )
}
