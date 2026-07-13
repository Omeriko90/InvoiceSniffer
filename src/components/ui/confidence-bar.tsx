import { cn } from "@/lib/utils"

// Default fill color by confidence threshold, expressed as design-system tokens.
function thresholdClass(pct: number): string {
  return pct >= 85 ? "bg-success" : pct >= 55 ? "bg-warning" : "bg-danger"
}

/**
 * Confidence meter used across the reconcile surfaces (row, drawer, find modal).
 * Pass `barClassName` to force a fill color (e.g. status-driven); otherwise the
 * fill is colored by the confidence threshold.
 */
export function ConfidenceBar({
  value,
  barClassName,
  size = "sm",
  showLabel = true,
  className,
}: {
  value: number // 0..1
  barClassName?: string
  size?: "sm" | "md"
  showLabel?: boolean
  className?: string
}) {
  const pct = Math.round(value * 100)
  return (
    <div
      className={cn("flex items-center gap-[6px]", className)}
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% match confidence`}
    >
      <div
        className={cn(
          "flex-1 bg-hover rounded-full overflow-hidden",
          size === "md" ? "h-[6px]" : "h-[5px]"
        )}
      >
        <div
          className={cn("h-full rounded-full", barClassName ?? thresholdClass(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={
            size === "md"
              ? "text-[12px] font-[700] text-heading"
              : "text-[11px] font-[600] text-dim"
          }
        >
          {pct}%
        </span>
      )}
    </div>
  )
}
