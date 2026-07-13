// Client component by import — only ever rendered from <ImportWizard>.
import { AlertCircle } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Dropzone } from "./Dropzone"
import { UploadStepProps } from "./types"

export function UploadStep({ onFile, error }: UploadStepProps) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-8">
      <Dropzone onFile={onFile} />

      {error && (
        <Alert className="mt-4 px-3 py-[11px] rounded-[10px]" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <AlertCircle size={18} strokeWidth={2} color="#DC2626" className="shrink-0" />
          <AlertTitle className="font-normal text-[13.5px] text-[#7F1D1D]">{error}</AlertTitle>
        </Alert>
      )}
    </div>
  )
}
