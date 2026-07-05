import { DashboardData } from "@/api-types/dashboard"

async function fetchDashboard(): Promise<DashboardData> {
    const res = await fetch("/api/dashboard")
    if (!res.ok) throw new Error("Failed to load dashboard")
    return res.json()
  }


  export { fetchDashboard }