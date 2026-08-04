// Client component by import — only ever rendered from already-client parents.
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Confirm-button label shown while `isPending`. Falls back to `confirmLabel`. */
  pendingLabel?: string
  /** Red confirm button for destructive actions. */
  destructive?: boolean
  /** Disables both buttons and swaps the confirm label to `pendingLabel`. */
  isPending?: boolean
  onConfirm: () => void
  /** Optional content rendered between the description and the footer. */
  children?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel,
  destructive = false,
  isPending = false,
  onConfirm,
  children,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        <DialogFooter className="border-t-0 bg-transparent p-0">
          <Button
            variant="outline"
            className="rounded-lg text-sm font-semibold"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? undefined : "default"}
            className={cn(
              "rounded-lg text-sm font-bold",
              destructive && "border-0 bg-danger text-white hover:opacity-90"
            )}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
