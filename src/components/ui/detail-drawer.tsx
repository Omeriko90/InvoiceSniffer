// Client component by import — only ever rendered from already-client parents.
import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Shared right-side drawer skeleton: a fixed-width Sheet with a bordered header,
// a scrollable body, and an optional footer. Mount conditionally on `open` so
// the body only renders when there's something to show.
export function DetailDrawer({
  open,
  onClose,
  header,
  footer,
  children,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: {
  open: boolean
  onClose: () => void
  header: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  // Passthrough for the SheetContent (e.g. a wider width).
  className?: string
  // Passthroughs for the header / body / footer wrappers, when a caller needs
  // to tweak the default padding without giving up the shared structure.
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <SheetContent
          side="right"
          className={cn(
            "w-[440px] sm:max-w-[440px] gap-0 bg-surface border-l border-border",
            className
          )}
          style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
        >
          <div
            className={cn(
              "px-[22px] py-[18px] border-b border-hover shrink-0",
              headerClassName
            )}
          >
            {header}
          </div>

          <div className={cn("flex-1 overflow-y-auto p-[22px]", contentClassName)}>
            {children}
          </div>

          {footer && (
            <div
              className={cn(
                "px-[22px] py-[16px] border-t border-hover shrink-0",
                footerClassName
              )}
            >
              {footer}
            </div>
          )}
        </SheetContent>
      )}
    </Sheet>
  )
}
