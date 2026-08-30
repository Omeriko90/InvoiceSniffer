// Client component by import — only ever rendered from <DashboardPage>.
import { useState } from "react"
import { format as formatDate } from "date-fns"
import type { DateRange } from "react-day-picker"
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

// Calendar draft seeded from the current scope when it's already custom. Applies
// (and closes the popover) only once both endpoints are chosen.
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

  function handleSelect(next: DateRange | undefined) {
    setDraft(next)
    if (next?.from && next?.to) {
      onApply({
        from: formatDate(next.from, "yyyy-MM-dd"),
        to: formatDate(next.to, "yyyy-MM-dd"),
      })
    }
  }

  return <Calendar mode="range" selected={draft} onSelect={handleSelect} numberOfMonths={1} />
}
