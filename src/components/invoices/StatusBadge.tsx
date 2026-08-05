// Client component by import — only ever rendered from <InvoicesClient>.
import { MetaBadge } from "@/components/ui/meta-badge"
import type { StatusMeta } from "./types"

export function StatusBadge({ status }: { status: StatusMeta }) {
  return <MetaBadge label={status.label} bg={status.bg} color={status.color} />
}
