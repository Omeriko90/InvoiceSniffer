// Client component by import — only ever rendered from <AlertCard>.
// Small pill-shaped button matching the mock's View/Dismiss affordances.
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CardButton({
  onClick,
  disabled,
  muted,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-xs font-semibold px-3.5 py-1.75 rounded-lg border border-border bg-white whitespace-nowrap cursor-pointer transition-colors hover:bg-hover disabled:opacity-50 disabled:cursor-default",
        muted ? "text-dim" : "text-subtle"
      )}
    >
      {children}
    </Button>
  )
}
