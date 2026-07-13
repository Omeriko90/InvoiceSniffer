import {
  LayoutDashboard,
  FileText,
  Upload,
  GitMerge,
  Bell,
  Download,
} from "lucide-react"

export const WORKSPACE_NAV = [
  { label: "Dashboard",  href: "/",           icon: LayoutDashboard },
  { label: "Invoices",   href: "/invoices",   icon: FileText },
  { label: "Import CSV", href: "/import",     icon: Upload },
  { label: "Reconcile",  href: "/reconcile",  icon: GitMerge },
]

export const INSIGHTS_NAV = [
  { label: "Alerts",  href: "/alerts",  icon: Bell },
  { label: "Exports", href: "/exports", icon: Download },
]
