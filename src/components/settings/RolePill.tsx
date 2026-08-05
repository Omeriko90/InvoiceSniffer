// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { MetaBadge } from "@/components/ui/meta-badge"
import type { MemberRole } from "@/api-types/settings"
import { ROLE_META } from "./constants"

export function RolePill({ role }: { role: MemberRole }) {
  const meta = ROLE_META[role]
  return (
    <MetaBadge
      label={meta.label}
      bg={meta.bg}
      color={meta.color}
      className="shrink-0 text-[12px] px-[11px] py-[3px]"
    />
  )
}
