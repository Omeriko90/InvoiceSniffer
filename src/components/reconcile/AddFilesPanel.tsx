// Client component by import — only ever rendered from <ReconcileSession>.
import { useState } from "react"
import { toast } from "sonner"
import { FileSpreadsheet, X } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
import { Button } from "@/components/ui/button"
import { useCsvMappings, useSaveMapping } from "@/hooks/useImport"
import { UploadStep } from "@/components/import/UploadStep"
import { MapColumnsStep } from "@/components/import/MapColumnsStep"
import {
  ParsedCsv,
  DraftMapping,
  EMPTY_MAPPING,
  parseCsvText,
  headersKeyOf,
  labelFromFileName,
  autoDetectMapping,
  buildImportRows,
} from "@/lib/csv-import"
import type { SessionFileInput } from "@/api-types/reconcile"

export function AddFilesPanel({
  files,
  onAddFile,
  onRemoveFile,
  onReconcile,
  reconciling,
}: {
  files: SessionFileInput[]
  onAddFile: (file: SessionFileInput) => void
  onRemoveFile: (index: number) => void
  onReconcile: () => void
  reconciling: boolean
}) {
  const t = useT()
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<DraftMapping>(EMPTY_MAPPING)
  const [savedMappingLabel, setSavedMappingLabel] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { data: savedMappings = [] } = useCsvMappings()
  const saveMapping = useSaveMapping()

  async function handleFile(file: File) {
    setParseError(null)
    let csv: ParsedCsv
    try {
      csv = parseCsvText(file.name, await file.text())
    } catch {
      setParseError(t("reconcile.addFiles.parseError"))
      return
    }
    if (csv.headers.length === 0 || csv.records.length === 0) {
      setParseError(t("reconcile.addFiles.emptyError"))
      return
    }
    if (csv.duplicateHeaders.length > 0) {
      const names = csv.duplicateHeaders.map((h) => `"${h}"`).join(", ")
      toast.warning(t("reconcile.addFiles.duplicateColumnsTitle"), {
        description: t("reconcile.addFiles.duplicateColumnsDescription", { names }),
      })
    }

    const saved = savedMappings.find((m) => m.headersKey === headersKeyOf(csv.headers))
    if (saved) {
      setMapping({
        date: saved.mapping.date,
        merchant: saved.mapping.merchant,
        amount: saved.mapping.amount,
        currency: saved.mapping.currency ?? null,
      })
      setSavedMappingLabel(saved.label)
    } else {
      setMapping(autoDetectMapping(csv.headers))
      setSavedMappingLabel(null)
    }
    setParsed(csv)
  }

  function handleAdd() {
    if (!parsed || !mapping.date || !mapping.merchant || !mapping.amount) return
    const fullMapping = {
      date: mapping.date,
      merchant: mapping.merchant,
      amount: mapping.amount,
      currency: mapping.currency,
    }
    const { rows } = buildImportRows(parsed.records, fullMapping)
    if (rows.length === 0) {
      setParseError(t("reconcile.addFiles.noUsableRows"))
      return
    }

    onAddFile({ fileName: parsed.fileName, rows })
    saveMapping.mutate({
      mappingLabel: savedMappingLabel ?? labelFromFileName(parsed.fileName),
      headersKey: headersKeyOf(parsed.headers),
      mapping: fullMapping,
    })

    setParsed(null)
    setMapping(EMPTY_MAPPING)
    setSavedMappingLabel(null)
  }

  // Mapping a freshly-dropped file.
  if (parsed) {
    return (
      <MapColumnsStep
        parsed={parsed}
        mapping={mapping}
        onMappingChange={setMapping}
        savedMappingLabel={savedMappingLabel}
        onBack={() => {
          setParsed(null)
          setParseError(null)
        }}
        onImport={handleAdd}
        importing={false}
        importError={parseError}
        submitLabel={t("reconcile.addFiles.addCharges", { count: parsed.records.length })}
      />
    )
  }

  const totalCharges = files.reduce((n, f) => n + f.rows.length, 0)

  return (
    <div className="flex flex-col gap-3.5">
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {files.map((f, i) => (
            <div
              key={`${f.fileName}-${i}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-hover last:border-b-0"
            >
              <div className="w-[34px] h-[34px] rounded bg-hover flex items-center justify-center shrink-0">
                <FileSpreadsheet size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{f.fileName}</p>
                <p className="text-xs text-text-secondary">{t("reconcile.addFiles.chargesCount", { count: f.rows.length })}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemoveFile(i)}
                aria-label={t("reconcile.addFiles.removeFile", { fileName: f.fileName })}
                className="w-7 h-7 rounded flex items-center justify-center text-dim hover:bg-hover hover:text-dim transition-colors cursor-pointer [&_svg:not([class*='size-'])]:size-auto"
              >
                <X size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <UploadStep onFile={handleFile} error={parseError} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {files.length === 0
            ? t("reconcile.addFiles.addPrompt")
            : `${t("reconcile.addFiles.filesSummary", { count: files.length })} · ${t("reconcile.addFiles.chargesReady", { count: totalCharges })}`}
        </p>
        <Button
          variant="gradientSky"
          size="lg"
          disabled={files.length === 0 || reconciling}
          onClick={onReconcile}
        >
          {reconciling ? t("reconcile.addFiles.reconciling") : t("reconcile.addFiles.reconcileCharges", { count: totalCharges })}
        </Button>
      </div>
    </div>
  )
}
