export interface ColumnMapping {
  date: string
  merchant: string
  amount: string
  currency?: string | null
}

export interface SavedMapping {
  id: string
  label: string
  headersKey: string
  mapping: ColumnMapping
}

export interface ImportRow {
  date: string // ISO string
  merchant: string
  amount: number
  currency?: string
}

// Column mappings persist for reuse; transactions do not (reconciliation is
// ephemeral). The reconcile session saves the mapping when a file is added.
export interface SaveMappingRequest {
  mappingLabel: string
  headersKey: string
  mapping: ColumnMapping
}
