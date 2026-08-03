import { AlertItem } from "@/types/alert"
import type { InvoiceCategory } from "@/lib/invoice-categories"

export interface CategorySpend {
    category: InvoiceCategory
    currency: string
    total:    number
    count:    number
}

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
    spendByCategory: CategorySpend[]
    recentAlerts: AlertItem[]
    monthLabel:   string
  }