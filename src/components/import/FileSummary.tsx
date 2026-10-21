// Client component by import — only ever rendered from <ImportWizard>.
import { FileText, Info } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { useT } from "@/components/i18n/LocaleProvider"
import { FileSummaryProps } from "./types"

export function FileSummary({ parsed, savedMappingLabel }: FileSummaryProps) {
  const t = useT()
  return (
    <div className="bg-surface border border-border rounded-[14px] p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <FileText size={20} strokeWidth={1.8} className="text-text-secondary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-heading truncate">{parsed.fileName}</p>
          <p className="text-xs text-dim mt-0.5">
            {t("import_csv.file_summary.rows", { count: parsed.records.length })} · {t("import_csv.file_summary.columns_detected", { count: parsed.headers.length })}
          </p>
        </div>
      </div>

      {savedMappingLabel && (
        <Alert
          className="px-3 py-[11px] rounded-[10px] bg-info-bg border-info-border"
        >
          <Info size={16} strokeWidth={2} className="text-info-fg" />
          <AlertTitle className="font-normal text-sm text-info-fg">
            {t("import_csv.file_summary.saved_mapping_prefix")} <strong>{savedMappingLabel}</strong> {t("import_csv.file_summary.saved_mapping_suffix")}
          </AlertTitle>
        </Alert>
      )}
    </div>
  )
}
