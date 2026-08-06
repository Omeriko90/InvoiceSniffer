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
    <div className="bg-card border border-border rounded-lg p-[14px] flex flex-col gap-[12px]">
      <p className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
        Match against invoices from
      </p>
      <div className="flex flex-wrap items-center gap-[6px]">
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
        <div className="flex flex-wrap items-center gap-[10px]">
          <label className="flex items-center gap-[8px] text-[13px] text-text-secondary">
            From
            <Input
              type="date"
              value={(scope as { from: string }).from}
              onChange={(e) => onChange({ from: e.target.value, to: (scope as { to: string }).to })}
              className="h-auto py-[7px] px-[10px] text-[13px] w-[160px] border-border rounded"
            />
          </label>
          <label className="flex items-center gap-[8px] text-[13px] text-text-secondary">
            To
            <Input
              type="date"
              value={(scope as { to: string }).to}
              onChange={(e) => onChange({ from: (scope as { from: string }).from, to: e.target.value })}
              className="h-auto py-[7px] px-[10px] text-[13px] w-[160px] border-border rounded"
            />
          </label>
        </div>
      )}
    </div>
  )
}
