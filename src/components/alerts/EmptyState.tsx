// Client component by import — only ever rendered from the Alerts page.
import { BellOff } from "lucide-react"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <EmptyStateShell
      className="max-w-[880px]"
      icon={BellOff}
      title={filtered ? "No alerts in this category" : "No alerts right now"}
      description={
        filtered
          ? "Try a different severity filter — you're all caught up here."
          : "We'll flag unusual spend, spikes, missing recurring invoices, and new vendors as they come in."
      }
    />
  )
}
