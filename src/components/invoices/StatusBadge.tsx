// Client component by import — only ever rendered from <InvoicesClient>.
import { Badge } from "@/components/ui/badge"
import type { StatusMeta } from "./types"

export function StatusBadge({ status }: { status: StatusMeta }) {
  return (
    <Badge
      className="rounded-full h-auto text-[11.5px] font-[700] px-[10px] py-[2px]"
      style={{ background: status.bg, color: status.color }}
    >
      {status.label}
    </Badge>
  )
}
