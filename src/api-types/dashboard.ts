import { AlertItem } from "@/types/alert"

export interface DashboardData {
    unmatched:      number
    possible:       number
    matched:        number
    matchedDelta:   number
    alerts:         number
    criticalAlerts: number
    rec: {
      total:     number
      matched:   number
      possible:  number
      missing:   number
      noInvoice: number
    }
    recentAlerts: AlertItem[]
    monthLabel:   string
  }