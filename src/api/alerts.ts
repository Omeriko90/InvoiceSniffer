import type { AlertFilter, AlertsResponse } from "@/api-types/alerts"

async function fetchAlerts(severity: AlertFilter): Promise<AlertsResponse> {
  const res = await fetch(`/api/alerts?severity=${severity}`)
  if (!res.ok) throw new Error("Failed to load alerts")
  return res.json()
}

async function dismissAlert(id: string): Promise<void> {
  const res = await fetch(`/api/alerts/${id}`, { method: "PATCH" })
  if (!res.ok) throw new Error("Failed to dismiss alert")
}

export { fetchAlerts, dismissAlert }
