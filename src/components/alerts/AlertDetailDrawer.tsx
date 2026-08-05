// Client component by import — only ever rendered from the Alerts page.
import { DetailDrawer } from "@/components/ui/detail-drawer"
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
    <DetailDrawer
      open={!!alert}
      onClose={onClose}
      headerClassName="pt-5 pb-4"
      contentClassName="py-4.5 flex flex-col gap-4"
      header={alert ? <Body.Header alert={alert} /> : null}
      footer={
        alert ? (
          <Body.Footer alert={alert} onDismiss={onDismiss} dismissing={dismissing} />
        ) : undefined
      }
    >
      {alert && <Body.Content alert={alert} />}
    </DetailDrawer>
  )
}
