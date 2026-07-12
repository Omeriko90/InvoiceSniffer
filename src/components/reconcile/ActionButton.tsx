import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Semantic reconcile actions mapped onto the shared <Button> variants so they
// inherit the design-system tokens, focus rings, and disabled handling.
export type ActionVariant = "outline" | "neutral" | "green" | "blue" | "find"

const VARIANT_MAP: Record<
  ActionVariant,
  { variant: "outline" | "default" | "success"; className?: string }
> = {
  outline: { variant: "outline", className: "text-dim" },
  neutral: { variant: "outline", className: "text-subtle" },
  green:   { variant: "success" },
  blue:    { variant: "default" },
  // No token for this soft-blue accent yet, so it stays arbitrary but centralized.
  find:    { variant: "outline", className: "border-[#BFDBFF] text-[#3B6FE0] hover:bg-info-bg" },
}

export function ActionButton({
  variant,
  size = "sm",
  onClick,
  disabled,
  children,
  className,
}: {
  variant: ActionVariant
  size?: "sm" | "lg"
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  const mapped = VARIANT_MAP[variant]
  return (
    <Button
      variant={mapped.variant}
      size={size === "lg" ? "lg" : "sm"}
      onClick={onClick}
      disabled={disabled}
      className={cn("font-[600]", size === "lg" && "flex-1", mapped.className, className)}
    >
      {children}
    </Button>
  )
}
