// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { StatusPill } from "@/components/ui/status-pill"
import type { MemberRole } from "@/api-types/settings"
import { ROLE_META } from "./constants"

export function RolePill({ role }: { role: MemberRole }) {
  const meta = ROLE_META[role]
  return (
    <StatusPill bg={meta.bg} color={meta.color} size="md" className="shrink-0">
      {meta.label}
    </StatusPill>
  )
}
