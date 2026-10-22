"use client"

import { usePathname } from "next/navigation"
import { GmailSyncPill } from "./GmailSyncPill"
import { useT } from "@/components/i18n/LocaleProvider"
import type { TranslationKey } from "@/lib/i18n/translate"

// Map pathnames to page-title translation keys.
function titleKey(pathname: string): TranslationKey | null {
  if (pathname === "/") return "shell.pageTitle.dashboard"
  if (pathname.startsWith("/invoices"))  return "shell.pageTitle.invoices"
  if (pathname.startsWith("/import"))    return "shell.pageTitle.import"
  if (pathname.startsWith("/reconcile")) return "shell.pageTitle.reconcile"
  if (pathname.startsWith("/fixed-expenses")) return "shell.pageTitle.fixed_expenses"
  if (pathname.startsWith("/alerts"))    return "shell.pageTitle.alerts"
  if (pathname.startsWith("/exports"))   return "shell.pageTitle.exports"
  if (pathname.startsWith("/settings"))  return "shell.pageTitle.settings"
  return null
}

export function Topbar() {
  const t = useT()
  const key = titleKey(usePathname())
  const title = key ? t(key) : "InvoiceSniffer"

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
