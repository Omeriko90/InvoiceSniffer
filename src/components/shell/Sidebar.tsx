"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Upload,
  GitMerge,
  Bell,
  Download,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const WORKSPACE_NAV = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
  { label: "Invoices",   href: "/invoices",   icon: FileText },
  { label: "Import CSV", href: "/import",     icon: Upload },
  { label: "Reconcile",  href: "/reconcile",  icon: GitMerge },
]

const INSIGHTS_NAV = [
  { label: "Alerts",  href: "/alerts",  icon: Bell,     badge: 4 },
  { label: "Exports", href: "/exports", icon: Download },
]

type SidebarProps = {
  orgName?: string
  userName?: string
  userEmail?: string
  userInitials?: string
}

export function Sidebar({ orgName = "My Workspace", userName, userEmail, userInitials = "?" }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[248px] shrink-0 h-full bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-[18px] pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shadow-logo shrink-0"
            style={{ background: "linear-gradient(135deg, #7AA7FF, #A78BFA)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-[800] text-heading leading-none">Reconcile</p>
            <p className="text-[11px] text-muted mt-0.5 leading-none">{orgName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-[14px] flex flex-col gap-5 overflow-y-auto">
        <NavGroup label="Workspace" items={WORKSPACE_NAV} pathname={pathname} />
        <NavGroup label="Insights"  items={INSIGHTS_NAV}  pathname={pathname} />
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-[14px] pb-4 flex flex-col gap-1">
        <NavItem
          label="Settings"
          href="/settings"
          icon={Settings}
          active={pathname === "/settings"}
        />

        <div className="mt-1 flex items-center gap-2.5 px-2.5 py-2 rounded-[11px] bg-hover">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-[700] text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7AA7FF, #A78BFA)" }}
          >
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-[600] text-heading truncate">{userName ?? "User"}</p>
            <p className="text-[11px] text-muted truncate">{userEmail ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavGroup({ label, items, pathname }: {
  label: string
  items: typeof WORKSPACE_NAV
  pathname: string
}) {
  return (
    <div>
      <p className="text-[11px] font-[700] text-muted uppercase tracking-[0.05em] mb-1 px-2.5">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            badge={"badge" in item ? (item as { badge?: number }).badge : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function NavItem({ label, href, icon: Icon, active, badge }: {
  label: string
  href: string
  icon: React.ElementType
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[14px] transition-colors",
        active
          ? "font-[600] text-[#3B6FE0] bg-[rgba(122,167,255,0.16)]"
          : "font-[500] text-text-secondary hover:bg-hover"
      )}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-danger text-white text-[10px] font-[700] rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}
