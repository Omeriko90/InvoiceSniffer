import { ParsedCsv, DraftMapping } from "@/lib/csv-import"

export type Field = { key: keyof DraftMapping; label: string; hint: string; required: boolean }

export type MapColumnsStepProps = {
  parsed: ParsedCsv
  mapping: DraftMapping
  onMappingChange: (m: DraftMapping) => void
  savedMappingLabel: string | null
  onBack: () => void
  onImport: () => void
  importing: boolean
  importError: string | null
  /** Overrides the default "Import N transactions" primary-button label. */
  submitLabel?: string
}

export type UploadStepProps = {
  onFile: (file: File) => void
  error: string | null
}

export type ColumnSelectProps = {
  headers: string[]
  value: string | null
  onChange: (value: string | null) => void
}

export type MappingRowProps = {
  field: Field
  first: boolean
  headers: string[]
  value: string | null
  onChange: (value: string | null) => void
}

export type PreviewTableProps = {
  rows: Record<string, string>[]
  mapping: DraftMapping
}

export type FileSummaryProps = {
  parsed: ParsedCsv
  savedMappingLabel: string | null
}

export type StepIndicatorProps = {
  label: string
  stepNo: number
  current: number
  showConnector: boolean
}
