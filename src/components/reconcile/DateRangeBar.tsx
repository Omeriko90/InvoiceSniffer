// Client component by import — only ever rendered from <ReconcileSession>.
import { Input } from "@/components/ui/input"
import { ToggleChip } from "@/components/ui/toggle-chip"
import { DATE_RANGE_PRESETS, PRESET_LABELS, type DateRangePreset } from "@/lib/date-range"
import type { DateRangeScope } from "@/api-types/reconcile"

function isPreset(scope: DateRangeScope): scope is { preset: DateRangePreset } {
  return "preset" in scope
}

// Invoice window to match uploaded charges against. Presets are trailing windows
// ending today; "Custom" reveals two date fields.
export function DateRangeBar({
  scope,
  onChange,
}: {
  scope: DateRangeScope
  onChange: (scope: DateRangeScope) => void
}) {
  const custom = !isPreset(scope)
  const activePreset = isPreset(scope) ? scope.preset : null

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col gap-3">
      <p className="text-xs font-bold text-text-secondary">
        Match against invoices from
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_RANGE_PRESETS.map((p: DateRangePreset) => (
          <ToggleChip key={p} active={activePreset === p} onClick={() => onChange({ preset: p })}>
            {PRESET_LABELS[p]}
          </ToggleChip>
        ))}
        <ToggleChip active={custom} onClick={() => onChange(custom ? scope : { from: "", to: "" })}>
          Custom
        </ToggleChip>
      </div>

      {custom && (
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            From
            <Input
              type="date"
              value={(scope as { from: string }).from}
              onChange={(e) => onChange({ from: e.target.value, to: (scope as { to: string }).to })}
              className="h-auto py-1.75 px-2.5 text-sm w-40 border-border rounded"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            To
            <Input
              type="date"
              value={(scope as { to: string }).to}
              onChange={(e) => onChange({ from: (scope as { from: string }).from, to: e.target.value })}
              className="h-auto py-1.75 px-2.5 text-sm w-40 border-border rounded"
            />
          </label>
        </div>
      )}
    </div>
  )
}
