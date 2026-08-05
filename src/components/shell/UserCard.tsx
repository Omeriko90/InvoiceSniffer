"use client"

// Client component by import — only ever rendered from <Sidebar>.
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export function UserCard({ userName, userEmail, userInitials }: {
  userName?: string
  userEmail?: string
  userInitials: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mt-1 flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[11px] bg-hover text-start cursor-pointer outline-none transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary/40">
        <Avatar className="size-8 rounded-lg after:rounded-lg">
          <AvatarFallback
            className="rounded-lg text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7AA7FF, #A78BFA)" }}
          >
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-heading truncate">{userName ?? "User"}</p>
          <p className="text-xs text-dim truncate">{userEmail ?? ""}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[220px]">
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
