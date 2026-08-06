import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Shared preset/segment toggle button: a rounded-full pill that flips to the
// brand-blue active look (#EEF3FF / #3B6FE0) when selected, neutral fill
// (#F1F3F8 / #64748B) otherwise. Used for date-range presets and similar
// single-select chip rows.
export function ToggleChip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer",
        className,
      )}
      style={{
        background: active ? "#EEF3FF" : "#F1F3F8",
        color: active ? "#3B6FE0" : "#64748B",
      }}
    >
      {children}
    </button>
  )
}
