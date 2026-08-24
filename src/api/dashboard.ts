import { DashboardData } from "@/api-types/dashboard"

async function fetchDashboard(range: { from: string; to: string }): Promise<DashboardData> {
    const params = new URLSearchParams({ from: range.from, to: range.to })
    const res = await fetch(`/api/dashboard?${params}`)
    if (!res.ok) throw new Error("Failed to load dashboard")
    return res.json()
  }


  export { fetchDashboard }
