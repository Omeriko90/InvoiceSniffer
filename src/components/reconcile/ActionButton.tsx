import { Button } from "@/components/ui/components/buttons"
import { cn } from "@/lib/utils"

// Semantic reconcile actions mapped onto the shared <Button> variants so they
// inherit the design-system tokens, focus rings, and disabled handling.
export type ActionVariant = "outline" | "neutral" | "green" | "blue" | "find"

const VARIANT_MAP: Record<
  ActionVariant,
  { variant: "primary" | "secondary"; className?: string }
> = {
  outline: { variant: "secondary", className: "text-dim" },
  neutral: { variant: "secondary", className: "text-subtle" },
  green:   { variant: "primary", className: "bg-success text-primary-foreground hover:bg-success border-0" },
  blue:    { variant: "primary" },
  // No token for this soft-blue accent yet, so it stays arbitrary but centralized.
  find:    { variant: "secondary", className: "border-[#BFDBFF] text-[#3B6FE0] hover:bg-info-bg" },
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
