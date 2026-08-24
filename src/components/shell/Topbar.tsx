"use client"

import { usePathname } from "next/navigation"
import { GmailSyncPill } from "./GmailSyncPill"

// Map pathnames to page titles.
function getTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/invoices"))  return "Invoices"
  if (pathname.startsWith("/import"))    return "Import CSV"
  if (pathname.startsWith("/reconcile")) return "Reconcile"
  if (pathname.startsWith("/fixed-expenses")) return "Fixed Expenses"
  if (pathname.startsWith("/alerts"))    return "Alerts"
  if (pathname.startsWith("/exports"))   return "Exports"
  if (pathname.startsWith("/settings"))  return "Settings"
  return "InvoiceSniffer"
}

export function Topbar() {
  const title = getTitle(usePathname())

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-7 shrink-0">
      <h1 className="text-xl font-bold text-heading">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Gmail sync status pill — self-fetches; shows out-of-sync + reconnect */}
        <GmailSyncPill />
      </div>
    </header>
  )
}
