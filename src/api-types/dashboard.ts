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
    // Reclaimable VAT — always the current calendar month, independent of range.
    taxThisMonth: TaxByCurrency[]
    monthLabel:   string
}
