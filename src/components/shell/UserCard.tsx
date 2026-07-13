// Client component by import — only ever rendered from <Sidebar>.
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserCard({ userName, userEmail, userInitials }: {
  userName?: string
  userEmail?: string
  userInitials: string
}) {
  return (
    <div className="mt-1 flex items-center gap-2.5 px-2.5 py-2 rounded-[11px] bg-hover">
      <Avatar className="size-8 rounded-lg after:rounded-lg">
        <AvatarFallback
          className="rounded-lg text-[12px] font-[700] text-white"
          style={{ background: "linear-gradient(135deg, #7AA7FF, #A78BFA)" }}
        >
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[12px] font-[600] text-heading truncate">{userName ?? "User"}</p>
        <p className="text-[11px] text-dim truncate">{userEmail ?? ""}</p>
      </div>
    </div>
  )
}
