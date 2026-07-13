// Client component by import — only ever rendered from <InvoicesClient>.
import { Progress } from "@/components/ui/progress"
import { confidenceColor } from "./helpers"

export function ConfidenceCell({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  return (
    <div className="flex items-center gap-2">
      <Progress
        value={pct}
        className="flex-1 gap-0 **:data-[slot=progress-track]:h-[6px] **:data-[slot=progress-track]:bg-[#F1F3F8] **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-(--conf)"
        style={{ "--conf": confidenceColor(confidence) } as React.CSSProperties}
      />
      <span className="text-[12px] font-[600] text-[#64748B] w-[30px] text-right shrink-0">
        {pct}%
      </span>
    </div>
  )
}
