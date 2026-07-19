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
      <DropdownMenuTrigger className="mt-1 flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[11px] bg-hover text-left cursor-pointer outline-none transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary/40">
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
