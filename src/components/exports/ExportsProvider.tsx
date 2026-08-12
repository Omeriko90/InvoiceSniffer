"use client"

import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchExportStatus, downloadExport } from "@/api/exports"

// Tracks in-flight async PDF exports at the app-shell level so polling and the
// "ready" toast survive route changes AND page refreshes. Active job ids are
// persisted to localStorage and rehydrated on mount.

const STORAGE_KEY = "invoicesniffer.activeExports"
// Exports that finished (READY) but the user hasn't looked at yet — drives the
// unread badge on the Exports nav item, so a completed export is discoverable
// even after the transient toast is gone or the tab was closed at the time.
const READY_KEY = "invoicesniffer.readyExports"
const TERMINAL = new Set(["READY", "EXPIRED", "FAILED"])

type ExportsContextValue = {
  // Begin tracking a newly-created PDF export job (shows a loading toast).
  trackExport: (id: string) => void
  // Count of finished-but-unviewed exports (nav badge).
  readyCount: number
  // Clear the unviewed set — called when the user opens the Exports page.
  markReadyViewed: () => void
}

const ExportsContext = createContext<ExportsContextValue | null>(null)

export function useExports(): ExportsContextValue {
  const ctx = useContext(ExportsContext)
  if (!ctx) throw new Error("useExports must be used within <ExportsProvider>")
  return ctx
}

function readStored(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

function writeStored(key: string, ids: string[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function ExportsProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage. Safe against SSR (readStored returns [] when
  // there's no window) and against hydration mismatch, since this provider
  // renders no DOM derived from activeIds.
  const [activeIds, setActiveIds] = useState<string[]>(() => readStored(STORAGE_KEY))
  // Finished-but-unviewed export ids; drives the nav badge, persisted so it
  // survives reloads until the user opens the Exports page.
  const [readyIds, setReadyIds] = useState<string[]>(() => readStored(READY_KEY))
  // Ids we've already resolved (toasted) this session — guards double toasts.
  const resolved = useRef<Set<string>>(new Set())

  const persist = useCallback((ids: string[]) => {
    setActiveIds(ids)
    writeStored(STORAGE_KEY, ids)
  }, [])

  const persistReady = useCallback((ids: string[]) => {
    setReadyIds(ids)
    writeStored(READY_KEY, ids)
  }, [])

  const markReadyViewed = useCallback(() => {
    persistReady([])
  }, [persistReady])

  const trackExport = useCallback(
    (id: string) => {
      resolved.current.delete(id)
      toast.loading("Building your PDF…", {
        id: `export-${id}`,
        description: "This can take a moment while we gather your invoices.",
      })
      persist(Array.from(new Set([...readStored(STORAGE_KEY), id])))
    },
    [persist]
  )

  const results = useQueries({
    queries: activeIds.map((id) => ({
      queryKey: ["export-status", id],
      queryFn: () => fetchExportStatus(id),
      // Poll until terminal; then stop.
      refetchInterval: (query: { state: { data?: { status?: string } } }) => {
        const status = query.state.data?.status
        return status && TERMINAL.has(status) ? false : 2000
      },
      staleTime: 0,
    })),
  })

  useEffect(() => {
    let changed = false
    const remaining = [...activeIds]
    const newlyReady: string[] = []

    results.forEach((r) => {
      const data = r.data
      if (!data || !TERMINAL.has(data.status) || resolved.current.has(data.id)) return
      resolved.current.add(data.id)

      if (data.status === "READY") {
        newlyReady.push(data.id)
        const skippedNote =
          data.skippedCount > 0
            ? ` ${data.skippedCount} invoice${data.skippedCount === 1 ? "" : "s"} couldn't be included and ${data.skippedCount === 1 ? "was" : "were"} skipped.`
            : ""
        toast.success("Your PDF is ready", {
          id: `export-${data.id}`,
          description: `Download ${data.fileName ?? "your export"}.${skippedNote}`,
          action: { label: "Download", onClick: () => downloadExport(data.id) },
          // Stay until dismissed — a completion that auto-hides after a few
          // seconds is easy to miss. The unread nav badge is the fallback for
          // when the tab wasn't open at completion.
          duration: Infinity,
        })
      } else {
        toast.error("Export failed", {
          id: `export-${data.id}`,
          description:
            data.status === "EXPIRED"
              ? "The export expired before it could be downloaded."
              : "We couldn't build this export. Please try again.",
        })
      }

      const idx = remaining.indexOf(data.id)
      if (idx !== -1) {
        remaining.splice(idx, 1)
        changed = true
      }
    })

    if (changed) persist(remaining)
    if (newlyReady.length > 0) {
      persistReady(Array.from(new Set([...readStored(READY_KEY), ...newlyReady])))
    }
  }, [results, activeIds, persist, persistReady])

  return (
    <ExportsContext.Provider value={{ trackExport, readyCount: readyIds.length, markReadyViewed }}>
      {children}
    </ExportsContext.Provider>
  )
}
