"use client"

import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { useAlerts } from "@/hooks/useAlerts"
import { WORKSPACE_NAV, INSIGHTS_NAV } from "./constants"
import { Logo } from "./Logo"
import { NavGroup } from "./NavGroup"
import { NavItem } from "./NavItem"
import { UserCard } from "./UserCard"

type SidebarProps = {
  orgName?: string
  userName?: string
  userEmail?: string
  userInitials?: string
}

export function Sidebar({ orgName = "My Workspace", userName, userEmail, userInitials = "?" }: SidebarProps) {
  const pathname = usePathname()
  const { data: alertsData } = useAlerts("all")
  const alertCount = alertsData?.counts.all ?? 0

  return (
    <aside className="w-[248px] shrink-0 h-full bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <Logo orgName={orgName} />

      {/* Nav */}
      <nav className="flex-1 px-[14px] flex flex-col gap-5 overflow-y-auto">
        <NavGroup label="Workspace" items={WORKSPACE_NAV} pathname={pathname} />
        <NavGroup
          label="Insights"
          items={INSIGHTS_NAV}
          pathname={pathname}
          badges={{ "/alerts": alertCount || undefined }}
        />
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-[14px] pb-4 flex flex-col gap-1">
        <NavItem
          label="Settings"
          href="/settings"
          icon={Settings}
          active={pathname === "/settings"}
        />

        <UserCard userName={userName} userEmail={userEmail} userInitials={userInitials} />
      </div>
    </aside>
  )
}
