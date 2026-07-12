"use client"

import { useState } from "react"
import { BellOff } from "lucide-react"
import { useAlerts } from "@/hooks/useAlerts"
import { useDismissAlert } from "@/hooks/useDismissAlert"
import { AlertCard } from "@/components/alerts/AlertCard"
import { AlertDetailDrawer } from "@/components/alerts/AlertDetailDrawer"
import { AlertsSkeleton } from "@/components/alerts/AlertsSkeleton"
import { ALERT_FILTERS, type AlertFilter } from "@/api-types/alerts"
import type { AlertItem } from "@/types/alert"

const CHIP_META: Record<AlertFilter, { label: string; activeBg: string; activeBorder: string; activeColor: string }> = {
  all:      { label: "All",      activeBg: "#EEF3FF", activeBorder: "#BFD3FF", activeColor: "#3B6FE0" },
  critical: { label: "Critical", activeBg: "#FEF2F2", activeBorder: "#FECACA", activeColor: "#DC2626" },
  warning:  { label: "Warning",  activeBg: "#FFFBEB", activeBorder: "#FDE68A", activeColor: "#B45309" },
  info:     { label: "Info",     activeBg: "#EFF6FF", activeBorder: "#BFDBFF", activeColor: "#2563EB" },
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertFilter>("all")
  const [selected, setSelected] = useState<AlertItem | null>(null)

  const { data, isPending } = useAlerts(filter)
  const dismiss = useDismissAlert()

  const counts = data?.counts ?? { all: 0, critical: 0, warning: 0, info: 0 }

  const handleDismiss = (id: string) => {
    dismiss.mutate(id, {
      onSuccess: () => setSelected((cur) => (cur?.id === id ? null : cur)),
    })
  }

  return (
    <div className="flex flex-col">
      {/* Severity filter chips — each selection refetches server-side */}
      <div className="flex gap-[8px] mb-[18px]">
        {ALERT_FILTERS.map((key) => {
          const chip   = CHIP_META[key]
          const active = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="text-[13px] font-[600] px-[13px] py-[7px] rounded-[10px] border cursor-pointer transition-colors"
              style={
                active
                  ? { background: chip.activeBg, borderColor: chip.activeBorder, color: chip.activeColor }
                  : { background: "#fff", borderColor: "#E8EDFA", color: "#334155" }
              }
            >
              {chip.label}{" "}
              <span style={{ color: active ? chip.activeColor : "#94A3B8" }}>{counts[key]}</span>
            </button>
          )
        })}
      </div>

      {isPending ? (
        <AlertsSkeleton />
      ) : !data || data.alerts.length === 0 ? (
        <EmptyState filtered={filter !== "all"} />
      ) : (
        <div className="flex flex-col gap-[12px] max-w-[880px]">
          {data.alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onView={() => setSelected(alert)}
              onDismiss={() => handleDismiss(alert.id)}
              dismissing={dismiss.isPending && dismiss.variables === alert.id}
            />
          ))}
        </div>
      )}

      <AlertDetailDrawer
        alert={selected}
        onClose={() => setSelected(null)}
        onDismiss={handleDismiss}
        dismissing={dismiss.isPending}
      />
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 max-w-[880px]">
      <div className="w-14 h-14 rounded-xl bg-[#F1F3F8] flex items-center justify-center mb-4">
        <BellOff size={26} strokeWidth={1.5} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">
        {filtered ? "No alerts in this category" : "No alerts right now"}
      </p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6]">
        {filtered
          ? "Try a different severity filter — you're all caught up here."
          : "We'll flag unusual spend, spikes, missing recurring invoices, and new vendors as they come in."}
      </p>
    </div>
  )
}
