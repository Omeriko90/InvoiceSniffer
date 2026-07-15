"use client"

import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchExportStatus, downloadExport } from "@/api/exports"

// Tracks in-flight async PDF exports at the app-shell level so polling and the
// "ready" toast survive route changes AND page refreshes. Active job ids are
// persisted to localStorage and rehydrated on mount.

const STORAGE_KEY = "invoicesniffer.activeExports"
const TERMINAL = new Set(["READY", "EXPIRED", "FAILED"])

type ExportsContextValue = {
  // Begin tracking a newly-created PDF export job (shows a loading toast).
  trackExport: (id: string) => void
}

const ExportsContext = createContext<ExportsContextValue | null>(null)

export function useExports(): ExportsContextValue {
  const ctx = useContext(ExportsContext)
  if (!ctx) throw new Error("useExports must be used within <ExportsProvider>")
  return ctx
}

function readStored(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

export function ExportsProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage. Safe against SSR (readStored returns [] when
  // there's no window) and against hydration mismatch, since this provider
  // renders no DOM derived from activeIds.
  const [activeIds, setActiveIds] = useState<string[]>(readStored)
  // Ids we've already resolved (toasted) this session — guards double toasts.
  const resolved = useRef<Set<string>>(new Set())

  const persist = useCallback((ids: string[]) => {
    setActiveIds(ids)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
      } catch {
        /* ignore quota / private-mode errors */
      }
    }
  }, [])

  const trackExport = useCallback(
    (id: string) => {
      resolved.current.delete(id)
      toast.loading("Building your PDF…", {
        id: `export-${id}`,
        description: "This can take a moment while we gather your invoices.",
      })
      persist(Array.from(new Set([...readStored(), id])))
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

    results.forEach((r) => {
      const data = r.data
      if (!data || !TERMINAL.has(data.status) || resolved.current.has(data.id)) return
      resolved.current.add(data.id)

      if (data.status === "READY") {
        const skippedNote =
          data.skippedCount > 0
            ? ` ${data.skippedCount} invoice${data.skippedCount === 1 ? "" : "s"} had no PDF and ${data.skippedCount === 1 ? "was" : "were"} skipped.`
            : ""
        toast.success("Your PDF is ready", {
          id: `export-${data.id}`,
          description: `Download ${data.fileName ?? "your export"}.${skippedNote}`,
          action: { label: "Download", onClick: () => downloadExport(data.id) },
          duration: 15000,
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
  }, [results, activeIds, persist])

  return <ExportsContext.Provider value={{ trackExport }}>{children}</ExportsContext.Provider>
}
