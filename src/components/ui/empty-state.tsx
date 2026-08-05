// Client component by import — only ever rendered from already-client parents.
import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Centered "no data" block: icon tile, title, description, and an optional
// action (e.g. a CTA button). Callers own the action so page-specific logic
// stays out of here.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: React.ReactNode
  description: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8", className)}>
      <div className="w-14 h-14 rounded-xl bg-hover flex items-center justify-center mb-4">
        <Icon size={26} strokeWidth={1.5} className="text-dim" />
      </div>
      <p className="text-base font-bold text-heading mb-2">{title}</p>
      <p
        className={cn(
          "text-sm text-text-secondary text-center max-w-[340px] leading-[1.6]",
          action && "mb-6"
        )}
      >
        {description}
      </p>
      {action}
    </div>
  )
}
