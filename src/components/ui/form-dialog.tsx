// Client component by import — only ever rendered from already-client parents.
import * as React from "react"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Shared modal layout: a bordered header (title + optional description), a body
// slot, and a bordered footer holding the actions (typically Cancel + submit).
// Pass `onSubmit` to wrap the body and footer in a <form> so a submit button in
// `footer` fires it; otherwise the body and footer render as plain siblings.
export function FormDialog({
  title,
  description,
  footer,
  children,
  onSubmit,
  className,
  headerClassName,
  footerClassName,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
  // When set, the body + footer are wrapped in a <form> with this handler.
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  // Passthrough for the DialogContent (e.g. a custom width).
  className?: string
  headerClassName?: string
  footerClassName?: string
}) {
  const header = (
    <DialogHeader
      className={cn(
        "px-[22px] pt-[20px] pb-[14px] border-b border-hover",
        headerClassName
      )}
    >
      <DialogTitle className="text-[16px] font-[700] text-heading">{title}</DialogTitle>
      {description && (
        <DialogDescription className="text-[12.5px] text-text-secondary">
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  )

  const footerBlock = (
    <DialogFooter
      className={cn("px-[22px] py-[14px] border-t border-hover", footerClassName)}
    >
      {footer}
    </DialogFooter>
  )

  return (
    <DialogContent
      className={cn("p-0 gap-0 bg-surface border-border rounded-[16px]", className)}
    >
      {header}
      {onSubmit ? (
        <form onSubmit={onSubmit}>
          {children}
          {footerBlock}
        </form>
      ) : (
        <>
          {children}
          {footerBlock}
        </>
      )}
    </DialogContent>
  )
}
