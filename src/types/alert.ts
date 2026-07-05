export interface AlertItem {
    id: string
    type: string
    details: unknown
    vendorName: string | null
    invoice: { vendorName: string | null } | null
  }