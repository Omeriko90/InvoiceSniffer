import {
  LayoutDashboard,
  FileText,
  Upload,
  GitMerge,
  Bell,
} from "lucide-react"

export const WORKSPACE_NAV = [
  { label: "Dashboard",  href: "/",           icon: LayoutDashboard },
  { label: "Invoices",   href: "/invoices",   icon: FileText },
  { label: "Import CSV", href: "/import",     icon: Upload },
  { label: "Reconcile",  href: "/reconcile",  icon: GitMerge },
]

// Exports is not built yet (the page is a stub). Hidden from nav so users can't
// reach it; re-add { label: "Exports", href: "/exports", icon: Download } when
// the export flow ships.
export const INSIGHTS_NAV = [
  { label: "Alerts",  href: "/alerts",  icon: Bell },
]
