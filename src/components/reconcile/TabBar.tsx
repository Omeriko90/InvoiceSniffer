// Client component by import — only ever rendered from <ReconcileClient>.
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TabId } from "@/components/reconcile/types"

export function TabBar({
  tabs,
  tab,
  onSelect,
}: {
  tabs: { id: TabId; label: string; count: number }[]
  tab: TabId
  onSelect: (id: TabId) => void
}) {
  return (
    <div className="flex items-center gap-1.5 mb-4 bg-card border border-border rounded-lg p-1.25 w-fit">
      {tabs.map((t) => {
        const on = tab === t.id
        return (
          <Button
            key={t.id}
            variant="ghost"
            onClick={() => onSelect(t.id)}
            className={cn(
              "flex items-center gap-1.75 px-3.5 py-1.75 rounded-lg cursor-pointer text-sm font-semibold transition-colors",
              on ? "bg-primary-soft text-primary-strong" : "text-text-secondary",
            )}
          >
            {t.label}
            <span
              className={cn(
                "text-xs font-bold px-1.75 rounded-full",
                on ? "bg-primary text-white" : "bg-hover text-dim",
              )}
            >
              {t.count}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
