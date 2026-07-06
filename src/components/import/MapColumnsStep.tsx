import { ArrowRight, FileText, Info, AlertCircle } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ParsedCsv, DraftMapping, normalizeAmount } from "@/lib/csv-import"

type Field = { key: keyof DraftMapping; label: string; hint: string; required: boolean }

const FIELDS: Field[] = [
  { key: "date",     label: "Transaction date",    hint: "When the charge posted", required: true },
  { key: "merchant", label: "Merchant",            hint: "Who was paid",           required: true },
  { key: "amount",   label: "Amount",              hint: "Charge amount",          required: true },
  { key: "currency", label: "Currency (optional)", hint: "Defaults to USD",        required: false },
]

type MapColumnsStepProps = {
  parsed: ParsedCsv
  mapping: DraftMapping
  onMappingChange: (m: DraftMapping) => void
  savedMappingLabel: string | null
  onBack: () => void
  onImport: () => void
  importing: boolean
  importError: string | null
}

export function MapColumnsStep({
  parsed, mapping, onMappingChange, savedMappingLabel, onBack, onImport, importing, importError,
}: MapColumnsStepProps) {
  const complete = Boolean(mapping.date && mapping.merchant && mapping.amount)
  const previewRows = parsed.records.slice(0, 3)

  const formatAmount = (raw: string | undefined) => {
    const n = normalizeAmount(raw ?? "")
    if (n === null) return "—"
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
  }

  return (
    <div className="grid gap-[14px] items-start" style={{ gridTemplateColumns: "300px 1fr" }}>

      {/* File summary */}
      <div className="bg-surface border border-border rounded-[14px] p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FileText size={20} strokeWidth={1.8} className="text-text-secondary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[14.5px] font-[700] text-heading truncate">{parsed.fileName}</p>
            <p className="text-[12.5px] text-dim mt-0.5">
              {parsed.records.length} rows · {parsed.headers.length} columns detected
            </p>
          </div>
        </div>

        {savedMappingLabel && (
          <Alert
            className="px-3 py-[11px] rounded-[10px]"
            style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}
          >
            <Info size={16} strokeWidth={2} color="#3B82F6" />
            <AlertTitle className="font-normal text-[13px] text-[#1E40AF]">
              Saved mapping for <strong>{savedMappingLabel}</strong> applied automatically.
            </AlertTitle>
          </Alert>
        )}
      </div>

      {/* Mapping */}
      <div className="bg-surface border border-border rounded-[14px] p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-[16px] font-[700] text-heading">Map your columns</h2>
          <p className="text-[13.5px] text-text-secondary mt-1">
            Tell us which CSV columns hold the date, merchant, and amount.
          </p>
        </div>

        <div className="flex flex-col">
          {FIELDS.map((field, i) => (
            <div
              key={field.key}
              className={cn(
                "grid items-center gap-4 py-[14px]",
                i > 0 && "border-t border-border"
              )}
              style={{ gridTemplateColumns: "1fr 20px 1.4fr" }}
            >
              <div>
                <p className="text-[14px] font-[600] text-heading">{field.label}</p>
                <p className="text-[12.5px] text-dim mt-0.5">{field.hint}</p>
              </div>
              <ArrowRight size={15} strokeWidth={2} className="text-faint" />
              <ColumnSelect
                headers={parsed.headers}
                value={mapping[field.key]}
                onChange={(v) => onMappingChange({ ...mapping, [field.key]: v })}
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div>
          <p className="text-[12px] font-[700] text-text-secondary uppercase tracking-[0.04em] mb-2.5">
            Preview (first 3 rows)
          </p>
          <div className="border border-border rounded-[10px] overflow-hidden">
            <Table className="text-left">
              <TableHeader>
                <TableRow className="border-border bg-background hover:bg-background">
                  <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em]">Date</TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em]">Merchant</TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em] text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i} className="border-border hover:bg-transparent">
                    <TableCell className="px-4 py-2.5 text-[13px] font-mono text-text-primary">
                      {mapping.date ? row[mapping.date] : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[13px] font-mono text-text-primary uppercase whitespace-normal">
                      {mapping.merchant ? row[mapping.merchant] : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[13.5px] font-[700] text-heading text-right">
                      {mapping.amount ? formatAmount(row[mapping.amount]) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {importError && (
          <Alert className="px-3 py-[11px] rounded-[10px]" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
            <AlertCircle size={18} strokeWidth={2} color="#DC2626" />
            <AlertTitle className="font-normal text-[13.5px] text-[#7F1D1D]">{importError}</AlertTitle>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="lg" className="text-[13.5px] px-4" onClick={onBack}>
            Back
          </Button>
          <Button
            size="lg"
            className="text-[13.5px] px-4 text-white shadow-primary border-0"
            style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
            disabled={!complete || importing}
            onClick={onImport}
          >
            {importing ? "Importing…" : `Import ${parsed.records.length} transactions`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ColumnSelect({ headers, value, onChange }: {
  headers: string[]
  value: string | null
  onChange: (value: string | null) => void
}) {
  const items = [
    { value: null, label: "— not mapped —" },
    ...headers.map((h) => ({ value: h, label: h })),
  ]
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v as string | null)}>
      <SelectTrigger
        className={cn(
          "w-full h-10 pl-3.5 pr-3 rounded-[9px] text-[13.5px]",
          value
            ? "text-heading font-[500] border-[#D1FAE5] bg-[#F0FDF4]"
            : "text-dim border-border bg-surface"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>— not mapped —</SelectItem>
        {headers.map((h) => (
          <SelectItem key={h} value={h}>{h}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
