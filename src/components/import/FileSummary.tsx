// Client component by import — only ever rendered from <ImportWizard>.
import { FileText, Info } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { FileSummaryProps } from "./types"

export function FileSummary({ parsed, savedMappingLabel }: FileSummaryProps) {
  return (
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
  )
}
