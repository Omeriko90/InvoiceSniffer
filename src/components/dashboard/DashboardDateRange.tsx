// Client component by import — only ever rendered from <DashboardPage>.
import { useState } from "react"
import { format as formatDate } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleChip } from "@/components/ui/toggle-chip"
import {
  DASHBOARD_PRESETS,
  DASHBOARD_PRESET_LABELS,
  isDashboardPreset,
  type DashboardScope,
} from "@/lib/dashboard-range"

// Overview window selector. Presets are trailing windows ending today; "Custom"
// opens a calendar popover that only commits once both endpoints are picked, so
// the dashboard never flickers through an incomplete (data-less) range.
export function DashboardDateRange({
  scope,
  onChange,
}: {
  scope: DashboardScope
  onChange: (scope: DashboardScope) => void
}) {
  const custom = !isDashboardPreset(scope)
  const activePreset = isDashboardPreset(scope) ? scope.preset : null
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DASHBOARD_PRESETS.map((p) => (
        <ToggleChip key={p} active={activePreset === p} onClick={() => onChange({ preset: p })}>
          {DASHBOARD_PRESET_LABELS[p]}
        </ToggleChip>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<ToggleChip active={custom}>Custom</ToggleChip>} />
        <PopoverContent align="start" className="w-auto">
          {/* Remounts on each open (Popup unmounts when closed), so the draft is
              always reseeded from the current scope. */}
          <CustomRangeCalendar
            scope={scope}
            onApply={(range) => {
              onChange(range)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Calendar draft seeded from the current scope when it's already custom. Opens
// on the start month (or today when there's no start yet), and only commits the
// range — closing the popover — when the user hits Apply with both endpoints set.
function CustomRangeCalendar({
  scope,
  onApply,
}: {
  scope: DashboardScope
  onApply: (range: { from: string; to: string }) => void
}) {
  const [draft, setDraft] = useState<DateRange | undefined>(() =>
    isDashboardPreset(scope) ? undefined : { from: new Date(scope.from), to: new Date(scope.to) }
  )
  const canApply = !!draft?.from && !!draft?.to

  function apply() {
    if (!draft?.from || !draft?.to) return
    onApply({
      from: formatDate(draft.from, "yyyy-MM-dd"),
      to: formatDate(draft.to, "yyyy-MM-dd"),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Calendar
        mode="range"
        selected={draft}
        onSelect={setDraft}
        numberOfMonths={1}
        defaultMonth={draft?.from ?? new Date()}
      />
      <div className="flex justify-end px-1 pb-1">
        <Button size="sm" disabled={!canApply} onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  )
}
