// Client component by import — only ever rendered from the Alerts page.
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import type { AlertItem } from "@/types/alert"
import { Body } from "@/components/alerts/Body"

export function AlertDetailDrawer({
  alert,
  onClose,
  onDismiss,
  dismissing,
}: {
  alert: AlertItem | null
  onClose: () => void
  onDismiss: (id: string) => void
  dismissing: boolean
}) {
  return (
    <Sheet open={!!alert} onOpenChange={(open) => !open && onClose()}>
      {alert && (
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] bg-white border-[#E8EDFA] p-0 gap-0 flex flex-col"
        >
          <Body alert={alert} onDismiss={onDismiss} dismissing={dismissing} />
        </SheetContent>
      )}
    </Sheet>
  )
}
