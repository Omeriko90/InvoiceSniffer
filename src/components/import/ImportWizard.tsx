"use client"

import { useState } from "react"
import { useCsvMappings, useImportTransactions } from "@/hooks/useImport"
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
import { Stepper } from "./Stepper"
import { UploadStep } from "./UploadStep"
import { MapColumnsStep } from "./MapColumnsStep"
import { DoneStep } from "./DoneStep"

export function ImportWizard() {
  const [step, setStep] = useState(1)
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<DraftMapping>(EMPTY_MAPPING)
  const [savedMappingLabel, setSavedMappingLabel] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)

  const { data: savedMappings = [] } = useCsvMappings()
  const importMutation = useImportTransactions()

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
    setStep(2)
  }

  function handleImport() {
    if (!parsed || !mapping.date || !mapping.merchant || !mapping.amount) return
    const fullMapping = {
      date: mapping.date,
      merchant: mapping.merchant,
      amount: mapping.amount,
      currency: mapping.currency,
    }
    const { rows, skipped } = buildImportRows(parsed.records, fullMapping)
    if (rows.length === 0) return

    importMutation.mutate(
      {
        fileName: parsed.fileName,
        mappingLabel: savedMappingLabel ?? labelFromFileName(parsed.fileName),
        headersKey: headersKeyOf(parsed.headers),
        mapping: fullMapping,
        rows,
      },
      {
        onSuccess: (result) => {
          setImportedCount(result.imported)
          setSkippedCount(skipped)
          setStep(3)
        },
      }
    )
  }

  function handleReset() {
    setStep(1)
    setParsed(null)
    setMapping(EMPTY_MAPPING)
    setSavedMappingLabel(null)
    setParseError(null)
    importMutation.reset()
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={step} />

      {step === 1 && <UploadStep onFile={handleFile} error={parseError} />}

      {step === 2 && parsed && (
        <MapColumnsStep
          parsed={parsed}
          mapping={mapping}
          onMappingChange={setMapping}
          savedMappingLabel={savedMappingLabel}
          onBack={handleReset}
          onImport={handleImport}
          importing={importMutation.isPending}
          importError={importMutation.isError ? "Import failed — please try again." : null}
        />
      )}

      {step === 3 && (
        <DoneStep imported={importedCount} skipped={skippedCount} onImportAnother={handleReset} />
      )}
    </div>
  )
}
