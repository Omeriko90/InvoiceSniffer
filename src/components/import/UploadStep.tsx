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
        <Alert className="mt-4 px-3 py-[11px] rounded-[10px] bg-danger-bg border-danger-border">
          <AlertCircle size={18} strokeWidth={2} className="shrink-0 text-danger-fg" />
          <AlertTitle className="font-normal text-sm text-danger-fg">{error}</AlertTitle>
        </Alert>
      )}
    </div>
  )
}
