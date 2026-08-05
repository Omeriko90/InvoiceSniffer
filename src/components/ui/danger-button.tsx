// Client component by import — only ever rendered from already-client parents.
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// The repeated destructive outline button: a red-tinted outline that fills on
// hover. Built on the shared Button (outline variant) so focus/active behavior
// stays consistent. Callers add layout classes (e.g. `shrink-0`) via className.
export function DangerButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto text-sm font-semibold text-danger bg-surface border-danger-border rounded-[9px] px-3.5 py-[7px] hover:bg-danger-bg hover:text-danger disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}
