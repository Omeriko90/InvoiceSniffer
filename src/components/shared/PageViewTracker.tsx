"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { track } from "@/lib/analytics"

// Friendly, stable page names for the `page_viewed` event. PostHog also captures
// raw `$pageview` (with the pathname) via SPA tracking; this adds a named event
// with a human-readable page so funnels/retention don't hinge on URL shapes.
function pageNameForPath(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/invoices")) return "Invoices"
  if (pathname.startsWith("/import")) return "Import"
  if (pathname.startsWith("/reconcile")) return "Reconcile"
  if (pathname.startsWith("/fixed-expenses")) return "Fixed Expenses"
  if (pathname.startsWith("/alerts")) return "Alerts"
  if (pathname.startsWith("/exports")) return "Exports"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Other"
}

// Rendered from the authed layout so it runs on every app page. Fires on each
// App Router client navigation (usePathname changes). Renders nothing.
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    track("page_viewed", { page: pageNameForPath(pathname), path: pathname })
  }, [pathname])

  return null
}
