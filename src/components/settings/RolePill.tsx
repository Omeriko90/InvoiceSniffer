// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { StatusPill } from "@/components/ui/status-pill"
import type { MemberRole } from "@/api-types/settings"
import { ROLE_META } from "./constants"
import { cn } from "@/lib/utils"

export function RolePill({ role }: { role: MemberRole }) {
  const meta = ROLE_META[role]
  return (
    <StatusPill size="md" className={cn(meta.className)}>
      {meta.label}
    </StatusPill>
  )
}
