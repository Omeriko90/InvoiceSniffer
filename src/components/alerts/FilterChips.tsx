// Client component by import — only ever rendered from the Alerts page.
import { ALERT_FILTERS, type AlertFilter } from "@/api-types/alerts"
import { CHIP_META } from "@/components/alerts/constants"
import { Button } from "@/components/ui/components/buttons"

export function FilterChips({
  filter,
  onSelect,
  counts,
}: {
  filter: AlertFilter
  onSelect: (key: AlertFilter) => void
  counts: Record<AlertFilter, number>
}) {
  return (
    <div className="flex gap-[8px] mb-[18px]">
      {ALERT_FILTERS.map((key) => {
        const chip   = CHIP_META[key]
        const active = filter === key
        return (
          <Button
            key={key}
            variant="ghost"
            onClick={() => onSelect(key)}
            className="h-auto text-[13px] font-[600] px-[13px] py-[7px] rounded-[10px] border cursor-pointer transition-colors"
            style={
              active
                ? { background: chip.activeBg, borderColor: chip.activeBorder, color: chip.activeColor }
                : { background: "#fff", borderColor: "#E8EDFA", color: "#334155" }
            }
          >
            {chip.label}{" "}
            <span style={{ color: active ? chip.activeColor : "#94A3B8" }}>{counts[key]}</span>
          </Button>
        )
      })}
    </div>
  )
}
