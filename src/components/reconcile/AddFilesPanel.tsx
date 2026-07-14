// Client component by import — only ever rendered from <ReconcileSession>.
import { useState } from "react"
import { toast } from "sonner"
import { FileSpreadsheet, X } from "lucide-react"
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
      setParseError("Couldn't parse that file — make sure it's a valid CSV.")
      return
    }
    if (csv.headers.length === 0 || csv.records.length === 0) {
      setParseError("That file looks empty — no data rows found.")
      return
    }
    if (csv.duplicateHeaders.length > 0) {
      const names = csv.duplicateHeaders.map((h) => `"${h}"`).join(", ")
      toast.warning("Duplicate columns in this file", {
        description: `${names} appears more than once — repeats were renamed so you can pick the right column.`,
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
    const { rows, skipped } = buildImportRows(parsed.records, fullMapping)
    if (rows.length === 0) {
      setParseError("No usable rows — check that the date and amount columns are mapped correctly.")
      return
    }

    onAddFile({ fileName: parsed.fileName, rows })
    if (skipped > 0) {
      toast.info(`${skipped} row${skipped === 1 ? "" : "s"} skipped (unreadable date or amount).`)
    }
    // Remember the mapping for next time (best-effort).
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
        submitLabel={`Add ${parsed.records.length} charges`}
      />
    )
  }

  const totalCharges = files.reduce((n, f) => n + f.rows.length, 0)

  return (
    <div className="flex flex-col gap-[14px]">
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {files.map((f, i) => (
            <div
              key={`${f.fileName}-${i}`}
              className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-hover last:border-b-0"
            >
              <div className="w-[34px] h-[34px] rounded bg-hover flex items-center justify-center shrink-0">
                <FileSpreadsheet size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-[600] text-foreground truncate">{f.fileName}</p>
                <p className="text-[12px] text-text-secondary">{f.rows.length} charges</p>
              </div>
              <button
                onClick={() => onRemoveFile(i)}
                aria-label={`Remove ${f.fileName}`}
                className="w-[28px] h-[28px] rounded flex items-center justify-center text-dim hover:bg-hover transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <UploadStep onFile={handleFile} error={parseError} />

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">
          {files.length === 0
            ? "Add one or more CSVs — from several cards if you like."
            : `${files.length} file${files.length === 1 ? "" : "s"} · ${totalCharges} charges ready`}
        </p>
        <Button
          size="lg"
          className="text-[13.5px] px-4 text-white shadow-primary border-0"
          style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
          disabled={files.length === 0 || reconciling}
          onClick={onReconcile}
        >
          {reconciling ? "Reconciling…" : `Reconcile ${totalCharges} charges →`}
        </Button>
      </div>
    </div>
  )
}
