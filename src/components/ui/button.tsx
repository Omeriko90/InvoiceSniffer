import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { trackInput, type AnalyticsInput } from "@/lib/analytics"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-primary hover:opacity-90",
        outline: "border-border bg-surface text-text-primary hover:bg-hover",
        ghost: "text-text-secondary hover:bg-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        success: "bg-success text-white hover:opacity-90",
        successOutline:
          "border-success-border bg-surface text-success hover:bg-success-bg",
        danger: "border-danger-border bg-surface text-danger hover:bg-danger-bg",
        ghostDanger: "text-dim hover:bg-danger-bg hover:text-danger-fg",
        destructive: "bg-danger text-white hover:opacity-90",
        link: "text-primary hover:opacity-80",
        gradientSky: "bg-gradient-sky text-white shadow-primary hover:opacity-90",
        gradientLogo: "bg-gradient-logo text-white shadow-primary hover:opacity-90",
      },
      size: {
        xs: "h-auto px-2 py-1 text-xs",
        sm: "h-auto px-3 py-[7px] text-[13px]",
        default: "h-auto px-3.5 py-2",
        lg: "h-auto px-4 py-2.5",
        xl: "h-auto px-4 py-3 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-6",
        inline: "h-auto p-0 gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  analytics,
  onClick,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    // Fire a named PostHog event when clicked. No-op in dev / when unset.
    analytics?: AnalyticsInput
  }) {
  const handleClick: ButtonPrimitive.Props["onClick"] = analytics
    ? (event) => {
        trackInput(analytics)
        onClick?.(event)
      }
    : onClick
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Button, buttonVariants }
