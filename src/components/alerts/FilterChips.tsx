// Client component by import — only ever rendered from the Alerts page.
import { ALERT_FILTERS, type AlertFilter } from "@/api-types/alerts"
import { CHIP_META } from "@/components/alerts/constants"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <div className="flex gap-2 mb-4.5">
      {ALERT_FILTERS.map((key) => {
        const chip   = CHIP_META[key]
        const active = filter === key
        return (
          <Button
            key={key}
            variant="ghost"
            onClick={() => onSelect(key)}
            className={cn(
              "text-sm font-semibold px-3.5 py-1.75 rounded-lg border cursor-pointer transition-colors",
              active ? chip.active : "bg-surface border-border text-foreground"
            )}
          >
            {chip.label}{" "}
            <span className={cn(active ? chip.count : "text-dim")}>{counts[key]}</span>
          </Button>
        )
      })}
    </div>
  )
}
