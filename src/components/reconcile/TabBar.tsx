// Client component by import — only ever rendered from <ReconcileClient>.
import { Button } from "@/components/ui/button"
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
            className="h-auto flex items-center gap-1.75 px-3.5 py-1.75 rounded-lg cursor-pointer text-sm font-semibold transition-colors"
            style={{ background: on ? "#EEF3FF" : "transparent", color: on ? "#3B6FE0" : "#64748B" }}
          >
            {t.label}
            <span
              className="text-xs font-bold px-1.75 rounded-full"
              style={{
                background: on ? "#7AA7FF" : "#F1F3F8",
                color: on ? "#fff" : "#94A3B8",
              }}
            >
              {t.count}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
