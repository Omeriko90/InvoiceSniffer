// Client component by import — only ever rendered from the Alerts page.
import { ALERT_FILTERS, type AlertFilter } from "@/api-types/alerts"
import { CHIP_META } from "@/components/alerts/constants"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n/LocaleProvider"

// Filter-chip labels live in sibling constants.ts (CHIP_META); mapped here to
// translation keys keyed by the stable filter value rather than editing the .ts.
const CHIP_LABEL_KEY: Record<AlertFilter, string> = {
  all:      "alerts.filter.all",
  critical: "alerts.filter.critical",
  warning:  "alerts.filter.warning",
  info:     "alerts.filter.info",
}

export function FilterChips({
  filter,
  onSelect,
  counts,
}: {
  filter: AlertFilter
  onSelect: (key: AlertFilter) => void
  counts: Record<AlertFilter, number>
}) {
  const t = useT()
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
            {CHIP_LABEL_KEY[key] ? t(CHIP_LABEL_KEY[key] as never) : chip.label}{" "}
            <span className={cn(active ? chip.count : "text-dim")}>{counts[key]}</span>
          </Button>
        )
      })}
    </div>
  )
}
