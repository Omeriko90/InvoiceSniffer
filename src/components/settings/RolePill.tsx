// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { StatusPill } from "@/components/ui/status-pill"
import { useT } from "@/components/i18n/LocaleProvider"
import type { TranslationKey } from "@/lib/i18n/translate"
import type { MemberRole } from "@/api-types/settings"
import { ROLE_META } from "./constants"
import { cn } from "@/lib/utils"

// The visible role name is localized here (ROLE_META only carries styling).
const ROLE_LABEL_KEYS: Record<MemberRole, TranslationKey> = {
  OWNER: "settings.members.role.owner" as TranslationKey,
  ADMIN: "settings.members.role.admin" as TranslationKey,
  MEMBER: "settings.members.role.member" as TranslationKey,
}

export function RolePill({ role }: { role: MemberRole }) {
  const t = useT()
  const meta = ROLE_META[role]
  return (
    <StatusPill size="md" className={cn(meta.className)}>
      {t(ROLE_LABEL_KEYS[role])}
    </StatusPill>
  )
}
