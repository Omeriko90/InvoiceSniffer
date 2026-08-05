// Client component by import — only ever rendered from already-client parents.
import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Metadata-driven pill: a rounded Badge whose colors come from a meta object
// ({ bg, color }). Domain badges (status, category, role…) wrap this so they
// share one consistent shape. Override sizing/spacing via `className`.
export function MetaBadge({
  label,
  bg,
  color,
  className,
}: {
  label: React.ReactNode
  bg: string
  color: string
  className?: string
}) {
  return (
    <Badge
      className={cn(
        "rounded-full h-auto text-xs font-bold px-[10px] py-[2px]",
        className
      )}
      style={{ background: bg, color }}
    >
      {label}
    </Badge>
  )
}
