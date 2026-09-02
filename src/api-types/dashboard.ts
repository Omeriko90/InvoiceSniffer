import type { InvoiceCategory } from "@/lib/invoice-categories"

export interface CategorySpend {
    category: InvoiceCategory
    currency: string
    total:    number
    count:    number
}

export interface TaxByCurrency {
    currency: string
    total:    number
    count:    number
}

export interface CurrencyTotal {
    currency: string
    total:    number
    count:    number
}

export interface TopVendor {
    vendor:   string
    currency: string
    total:    number
    count:    number
}

export interface SpendTrendPoint {
    // First day of the month, ISO "yyyy-MM-dd" (formatted client-side).
    month: string
    total: number
}

// Total spend per month across the selected range, in the dominant currency.
// Null when there's no spend in the range.
export interface SpendTrend {
    currency: string
    points:   SpendTrendPoint[]
}

export interface DashboardData {
    // The resolved range these figures cover (echoed back for the UI label).
    range: { from: string; to: string }
    // Counts within the range, split by document type.
    invoiceCount: number
    receiptCount: number
    // Spend within the range, grouped by currency (mixed-currency safe).
    totalSpend:      CurrencyTotal[]
    spendByCategory: CategorySpend[]
    topVendors:      TopVendor[]
    // Reclaimable VAT within the selected range, grouped by currency.
    reclaimableVat: TaxByCurrency[]
    // Monthly spend across the selected range.
    spendTrend: SpendTrend | null
}
