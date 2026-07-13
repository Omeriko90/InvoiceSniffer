"use client"

import { useState } from "react"
import { useAlerts } from "@/hooks/useAlerts"
import { useDismissAlert } from "@/hooks/useDismissAlert"
import { AlertCard } from "@/components/alerts/AlertCard"
import { AlertDetailDrawer } from "@/components/alerts/AlertDetailDrawer"
import { AlertsSkeleton } from "@/components/alerts/AlertsSkeleton"
import { FilterChips } from "@/components/alerts/FilterChips"
import { EmptyState } from "@/components/alerts/EmptyState"
import { type AlertFilter } from "@/api-types/alerts"
import type { AlertItem } from "@/types/alert"

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
      <FilterChips filter={filter} onSelect={setFilter} counts={counts} />

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
