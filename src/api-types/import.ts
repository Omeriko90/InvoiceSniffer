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

export interface ImportRequest {
  fileName: string
  mappingLabel: string
  headersKey: string
  mapping: ColumnMapping
  rows: ImportRow[]
}

export interface ImportResponse {
  imported: number
}
