"use client"

import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { useAlerts } from "@/hooks/useAlerts"
import { useExports } from "@/components/exports/ExportsProvider"
import { WORKSPACE_NAV, INSIGHTS_NAV } from "./constants"
import { Logo } from "./Logo"
import { NavGroup } from "./NavGroup"
import { NavItem } from "./NavItem"
import { UserCard } from "./UserCard"
import { useT } from "@/components/i18n/LocaleProvider"

type SidebarProps = {
  orgName?: string
  userName?: string
  userEmail?: string
  userInitials?: string
}

export function Sidebar({ orgName, userName, userEmail, userInitials = "?" }: SidebarProps) {
  const t = useT()
  const pathname = usePathname()
  const { data: alertsData } = useAlerts("all")
  const alertCount = alertsData?.counts.all ?? 0
  const { readyCount } = useExports()

  const navLabels: Record<string, string> = {
    "/": t("shell.nav.dashboard"),
    "/invoices": t("shell.nav.invoices"),
    "/reconcile": t("shell.nav.reconcile"),
    "/fixed-expenses": t("shell.nav.fixed_expenses"),
    "/alerts": t("shell.nav.alerts"),
    "/exports": t("shell.nav.exports"),
  }
  const workspaceNav = WORKSPACE_NAV.map((item) => ({ ...item, label: navLabels[item.href] ?? item.label }))
  const insightsNav = INSIGHTS_NAV.map((item) => ({ ...item, label: navLabels[item.href] ?? item.label }))

  return (
    <aside className="w-[248px] shrink-0 h-full bg-surface border-e border-border flex flex-col">
      {/* Logo */}
      <Logo orgName={orgName ?? t("shell.sidebar.default_org_name")} />

      {/* Nav */}
      <nav className="flex-1 px-3.5 flex flex-col gap-5 overflow-y-auto">
        <NavGroup label={t("shell.sidebar.group_workspace")} items={workspaceNav} pathname={pathname} />
        <NavGroup
          label={t("shell.sidebar.group_insights")}
          items={insightsNav}
          pathname={pathname}
          badges={{ "/alerts": alertCount || undefined, "/exports": readyCount || undefined }}
        />
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3.5 pb-4 flex flex-col gap-1">
        <NavItem
          label={t("shell.sidebar.settings")}
          href="/settings"
          icon={Settings}
          active={pathname === "/settings"}
        />

        <UserCard userName={userName} userEmail={userEmail} userInitials={userInitials} />
      </div>
    </aside>
  )
}
