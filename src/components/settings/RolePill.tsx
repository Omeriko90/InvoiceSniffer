// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Badge } from "@/components/ui/badge"
import type { MemberRole } from "@/api-types/settings"
import { ROLE_META } from "./constants"

export function RolePill({ role }: { role: MemberRole }) {
  const meta = ROLE_META[role]
  return (
    <Badge
      className="shrink-0 h-auto rounded-full text-[12px] font-[700] px-[11px] py-[3px]"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </Badge>
  )
}
