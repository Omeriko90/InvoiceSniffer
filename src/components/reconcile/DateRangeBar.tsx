// Client component by import — only ever rendered from <ReconcileSession>.
import { Input } from "@/components/ui/input"
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
        {DATE_RANGE_PRESETS.map((p: DateRangePreset) => {
          const on = activePreset === p
          return (
            <button
              key={p}
              onClick={() => onChange({ preset: p })}
              className="px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer"
              style={{
                background: on ? "#EEF3FF" : "#F1F3F8",
                color: on ? "#3B6FE0" : "#64748B",
              }}
            >
              {PRESET_LABELS[p]}
            </button>
          )
        })}
        <button
          onClick={() => onChange(custom ? scope : { from: "", to: "" })}
          className="px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer"
          style={{
            background: custom ? "#EEF3FF" : "#F1F3F8",
            color: custom ? "#3B6FE0" : "#64748B",
          }}
        >
          Custom
        </button>
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
