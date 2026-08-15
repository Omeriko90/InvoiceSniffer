// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import type { StatusMeta } from "./types"

export function StatusBadge({ status }: { status: StatusMeta }) {
  return (
    <StatusPill bg={status.bg} color={status.color}>
      {status.label}
    </StatusPill>
  )
}
