// Client component by import — only ever rendered from already-client parents.
import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

type InfoBoxVariant = "info" | "warning" | "success" | "danger" | "neutral"

// Variant → background tint. Border/icon colors vary per usage and stay with the
// caller (via `className` / the `icon` node) so exact visuals are preserved.
const variantBg: Record<InfoBoxVariant, string> = {
  info: "bg-info-bg",
  warning: "bg-warning-bg",
  success: "bg-success-bg",
  danger: "bg-danger-bg",
  neutral: "bg-raised",
}

export function InfoBox({
  variant = "info",
  icon,
  align = "center",
  children,
  className,
}: {
  variant?: InfoBoxVariant
  // A lucide icon component or any pre-rendered node; omit for no leading icon.
  icon?: ComponentType<{ className?: string; size?: number }> | ReactNode
  // Vertical alignment of the icon against the content ("start" for multi-line).
  align?: "center" | "start"
  children: ReactNode
  className?: string
}) {
  const Icon =
    typeof icon === "function"
      ? (icon as ComponentType<{ className?: string; size?: number }>)
      : null

  return (
    <div
      className={cn(
        "flex gap-2.5 border rounded-[11px] px-3.5 py-[11px]",
        align === "center" ? "items-center" : "items-start",
        variantBg[variant],
        className
      )}
    >
      {Icon ? (
        <Icon size={16} className={cn("shrink-0", align === "start" && "mt-px")} />
      ) : (
        (icon as ReactNode) ?? null
      )}
      {children}
    </div>
  )
}
