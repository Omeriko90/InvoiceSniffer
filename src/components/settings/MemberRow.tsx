// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Member } from "@/api-types/settings"
import { RolePill } from "./RolePill"
import { initials } from "./helpers"

export function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-[38px]">
        <AvatarFallback
          className="text-[12.5px] font-[700] text-white"
          style={{
            background: "linear-gradient(135deg, #A78BFA, #7AA7FF)",
          }}
        >
          {initials(member)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-[700] text-heading truncate leading-tight">
          {member.name ?? member.email}
        </p>
        <p className="text-[12.5px] text-text-secondary truncate">
          {member.email}
        </p>
      </div>
      <RolePill role={member.role} />
    </div>
  )
}
