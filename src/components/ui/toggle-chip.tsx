import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

// Shared preset/segment toggle button: a rounded-full pill that flips to the
// brand-blue active look (#EEF3FF / #3B6FE0) when selected, neutral fill
// (#F1F3F8 / #64748B) otherwise. Used for date-range presets and similar
// single-select chip rows. Forwards native button props so it can also serve as
// a popover trigger (base-ui injects ref/onClick/aria via the render prop).
export function ToggleChip({
  active,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer",
        className,
      )}
      style={{
        background: active ? "#EEF3FF" : "#F1F3F8",
        color: active ? "#3B6FE0" : "#64748B",
      }}
      {...props}
    >
      {children}
    </button>
  )
}
