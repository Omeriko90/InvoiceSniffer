// Client component by import — only ever rendered from <ImportWizard>.
import { AlertCircle } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FIELDS } from "./constants"
import { FileSummary } from "./FileSummary"
import { MappingRow } from "./MappingRow"
import { PreviewTable } from "./PreviewTable"
import { useT } from "@/components/i18n/LocaleProvider"
import { MapColumnsStepProps } from "./types"

export function MapColumnsStep({
  parsed, mapping, onMappingChange, savedMappingLabel, onBack, onImport, importing, importError, submitLabel,
}: MapColumnsStepProps) {
  const t = useT()
  const complete = Boolean(mapping.date && mapping.merchant && mapping.amount)
  const previewRows = parsed.records.slice(0, 3)

  return (
    <div className="grid gap-3.5 items-start" style={{ gridTemplateColumns: "300px 1fr" }}>

      {/* File summary */}
      <FileSummary parsed={parsed} savedMappingLabel={savedMappingLabel} />

      {/* Mapping */}
      <div className="bg-surface border border-border rounded-[14px] p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-bold text-heading">{t("import_csv.map_columns.title")}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t("import_csv.map_columns.description")}
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
          <Button variant="outline" size="lg" onClick={onBack}>
          {t("import_csv.map_columns.back")}
          </Button>
          <Button
            variant="gradientSky"
            size="lg"
            disabled={!complete || importing}
            onClick={onImport}
          >
            {importing
              ? t("import_csv.map_columns.adding")
              : submitLabel ?? t("import_csv.map_columns.import_cta", { count: parsed.records.length })}
          </Button>
        </div>
      </div>
    </div>
  )
}
