// Client component by import — only ever rendered from <ImportWizard>.
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { StepIndicatorProps } from "./types"

export function StepIndicator({ label, stepNo, current, showConnector }: StepIndicatorProps) {
  const done = stepNo < current
  const active = stepNo === current
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-[26px] h-[26px] rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
            done && "bg-success text-white",
            active && "bg-primary text-white",
            !done && !active && "bg-hover text-dim"
          )}
        >
          {done ? <Check size={14} strokeWidth={2.5} /> : stepNo}
        </div>
        <span
          className={cn(
            "text-sm",
            active || done ? "font-semibold text-heading" : "font-medium text-dim"
          )}
        >
          {label}
        </span>
      </div>
      {showConnector && (
        <div
          className={cn("w-[110px] h-px", done ? "bg-primary/50" : "bg-border")}
        />
      )}
    </div>
  )
}
