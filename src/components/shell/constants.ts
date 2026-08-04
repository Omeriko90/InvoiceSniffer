import {
  LayoutDashboard,
  FileText,
  GitMerge,
  Repeat,
  Bell,
  Download,
} from "lucide-react"

export const WORKSPACE_NAV = [
  { label: "Dashboard",       href: "/",                icon: LayoutDashboard },
  { label: "Invoices",        href: "/invoices",        icon: FileText },
  { label: "Reconcile",       href: "/reconcile",       icon: GitMerge },
  { label: "Fixed Expenses",  href: "/fixed-expenses",  icon: Repeat },
]

export const INSIGHTS_NAV = [
  { label: "Alerts",  href: "/alerts",  icon: Bell },
  { label: "Exports", href: "/exports", icon: Download },
]
