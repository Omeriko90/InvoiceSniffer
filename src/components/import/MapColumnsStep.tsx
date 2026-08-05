// Client component by import — only ever rendered from <ImportWizard>.
import { AlertCircle } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FIELDS } from "./constants"
import { FileSummary } from "./FileSummary"
import { MappingRow } from "./MappingRow"
import { PreviewTable } from "./PreviewTable"
import { MapColumnsStepProps } from "./types"

export function MapColumnsStep({
  parsed, mapping, onMappingChange, savedMappingLabel, onBack, onImport, importing, importError, submitLabel,
}: MapColumnsStepProps) {
  const complete = Boolean(mapping.date && mapping.merchant && mapping.amount)
  const previewRows = parsed.records.slice(0, 3)

  return (
    <div className="grid gap-3.5 items-start" style={{ gridTemplateColumns: "300px 1fr" }}>

      {/* File summary */}
      <FileSummary parsed={parsed} savedMappingLabel={savedMappingLabel} />

      {/* Mapping */}
      <div className="bg-surface border border-border rounded-[14px] p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-bold text-heading">Map your columns</h2>
          <p className="text-sm text-text-secondary mt-1">
            Tell us which CSV columns hold the date, merchant, and amount.
          </p>
        </div>

        <div className="flex flex-col">
          {FIELDS.map((field, i) => (
            <MappingRow
              key={field.key}
              field={field}
              first={i === 0}
              headers={parsed.headers}
              value={mapping[field.key]}
              onChange={(v) => onMappingChange({ ...mapping, [field.key]: v })}
            />
          ))}
        </div>

        {/* Preview */}
        <PreviewTable rows={previewRows} mapping={mapping} />

        {importError && (
          <Alert className="px-3 py-[11px] rounded-[10px] bg-danger-bg border-danger-border">
            <AlertCircle size={18} strokeWidth={2} className="text-danger-fg" />
            <AlertTitle className="font-normal text-sm text-danger-fg">{importError}</AlertTitle>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="lg" className="text-sm px-4" onClick={onBack}>
            Back
          </Button>
          <Button
            size="lg"
            className="text-sm px-4 text-white shadow-primary border-0 bg-gradient-sky"
            disabled={!complete || importing}
            onClick={onImport}
          >
            {importing
              ? "Adding…"
              : submitLabel ?? `Import ${parsed.records.length} transactions`}
          </Button>
        </div>
      </div>
    </div>
  )
}
