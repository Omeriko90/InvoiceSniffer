// Client component by import — only ever rendered from <DashboardPage>.
import { Input } from "@/components/ui/input"
import { ToggleChip } from "@/components/ui/toggle-chip"
import {
  DASHBOARD_PRESETS,
  DASHBOARD_PRESET_LABELS,
  isDashboardPreset,
  type DashboardScope,
} from "@/lib/dashboard-range"

// Overview window selector. Presets are trailing windows ending today; "Custom"
// reveals two date fields. Mirrors the reconcile DateRangeBar pattern.
export function DashboardDateRange({
  scope,
  onChange,
}: {
  scope: DashboardScope
  onChange: (scope: DashboardScope) => void
}) {
  const custom = !isDashboardPreset(scope)
  const activePreset = isDashboardPreset(scope) ? scope.preset : null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DASHBOARD_PRESETS.map((p) => (
        <ToggleChip key={p} active={activePreset === p} onClick={() => onChange({ preset: p })}>
          {DASHBOARD_PRESET_LABELS[p]}
        </ToggleChip>
      ))}
      <ToggleChip active={custom} onClick={() => onChange(custom ? scope : { from: "", to: "" })}>
        Custom
      </ToggleChip>

      {custom && (
        <div className="flex flex-wrap items-center gap-2.5 ms-1.5">
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
