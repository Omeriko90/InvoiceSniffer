import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Shared rounded-full status/category/role pill. The color pair comes from a
// per-feature meta lookup (dynamic → inline style); the structure is shared so
// feature wrappers (StatusBadge, CategoryBadge, RolePill, …) don't each re-declare
// the rounded-full + font-weight + sizing.
export type StatusPillSize = "xs" | "sm" | "md"

const SIZE_CLASSES: Record<StatusPillSize, string> = {
  xs: "text-[10px] px-[7px] py-[1.5px]",
  sm: "text-[11.5px] px-[10px] py-[2px]",
  md: "text-[12px] px-[11px] py-[3px]",
}

export function StatusPill({
  bg,
  color,
  size = "sm",
  className,
  children,
}: {
  bg?: string
  color?: string
  size?: StatusPillSize
  className?: string
  children: ReactNode
}) {
  return (
    <Badge
      className={cn("h-auto rounded-full font-[700]", SIZE_CLASSES[size], className)}
      style={{ background: bg, color }}
    >
      {children}
    </Badge>
  )
}
