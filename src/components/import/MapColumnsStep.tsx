import { ArrowRight, ChevronDown, FileText, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
            <p className="text-[12.5px] text-muted mt-0.5">
              {parsed.records.length} rows · {parsed.headers.length} columns detected
            </p>
          </div>
        </div>

        {savedMappingLabel && (
          <div
            className="flex items-start gap-2.5 px-3 py-[11px] rounded-[10px] border text-[13px] text-[#1E40AF]"
            style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}
          >
            <Info size={16} strokeWidth={2} color="#3B82F6" className="shrink-0 mt-0.5" />
            <span>
              Saved mapping for <strong>{savedMappingLabel}</strong> applied automatically.
            </span>
          </div>
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
                <p className="text-[12.5px] text-muted mt-0.5">{field.hint}</p>
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
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-2.5 text-[11px] font-[700] text-muted uppercase tracking-[0.05em]">Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-[700] text-muted uppercase tracking-[0.05em]">Merchant</th>
                  <th className="px-4 py-2.5 text-[11px] font-[700] text-muted uppercase tracking-[0.05em] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className={cn(i > 0 && "border-t border-border")}>
                    <td className="px-4 py-2.5 text-[13px] font-mono text-text-primary whitespace-nowrap">
                      {mapping.date ? row[mapping.date] : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-mono text-text-primary uppercase">
                      {mapping.merchant ? row[mapping.merchant] : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[13.5px] font-[700] text-heading text-right whitespace-nowrap">
                      {mapping.amount ? formatAmount(row[mapping.amount]) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {importError && (
          <div className="flex items-center gap-2.5 px-3 py-[11px] rounded-[10px] border text-[13.5px] text-[#7F1D1D]" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
            <AlertCircle size={18} strokeWidth={2} color="#DC2626" className="shrink-0" />
            {importError}
          </div>
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
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "w-full h-10 pl-3.5 pr-9 rounded-[9px] border text-[13.5px] appearance-none outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-ring/40",
          value
            ? "text-heading font-[500] border-[#D1FAE5] bg-[#F0FDF4]"
            : "text-muted border-border bg-surface"
        )}
      >
        <option value="">— not mapped —</option>
        {headers.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <ChevronDown size={15} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  )
}
