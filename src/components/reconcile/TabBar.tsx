// Client component by import — only ever rendered from <ReconcileClient>.
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
    <div className="flex items-center gap-[6px] mb-4 bg-card border border-border rounded-[12px] p-[5px] w-fit">
      {tabs.map((t) => {
        const on = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="flex items-center gap-[7px] px-[14px] py-[7px] rounded-[9px] cursor-pointer text-[13.5px] font-[600] transition-colors"
            style={{ background: on ? "#EEF3FF" : "transparent", color: on ? "#3B6FE0" : "#64748B" }}
          >
            {t.label}
            <span
              className="text-[11px] font-[700] px-[7px] rounded-full"
              style={{
                background: on ? "#7AA7FF" : "#F1F3F8",
                color: on ? "#fff" : "#94A3B8",
              }}
            >
              {t.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
