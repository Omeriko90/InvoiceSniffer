// Client component by import — only ever rendered from <GmailConnectionCard>.
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DangerButton } from "@/components/ui/danger-button"
import type { GmailConnection } from "@/api-types/settings"
import { useGmailSync } from "@/hooks/useGmailSync"
import { useT } from "@/components/i18n/LocaleProvider"
import { GoogleGlyph } from "./GoogleGlyph"
import { syncedDistance } from "./helpers"

interface ConnectedAccountPanelProps {
  gmail: GmailConnection
  onDisconnect: () => void
  disconnecting: boolean
}

export function ConnectedAccountPanel({ gmail, onDisconnect, disconnecting }: ConnectedAccountPanelProps) {
  const t = useT()
  const sync = useGmailSync()
  const syncing = sync.isPending && sync.variables === gmail.id

  // Soft-disconnected (e.g. refresh token expired/revoked): the account can't
  // sync until the user re-authorizes, so we surface an out-of-sync state with a
  // Reconnect action instead of the usual "Sync now".
  if (!gmail.connected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-warning-border bg-warning-bg px-4 py-3.5">
        <AlertTriangle size={18} className="shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-bold text-heading truncate">{gmail.label ?? gmail.email}</p>
          <p className="text-[12.5px] text-warning mt-1">
            {t("settings.gmail.outOfSync")}
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = "/api/gmail/connect" }}
          className="shrink-0"
        >
          {t("settings.gmail.reconnect")}
        </Button>
        <DangerButton
          onClick={onDisconnect}
          disabled={disconnecting}
          className="shrink-0"
        >
          {disconnecting ? t("settings.gmail.removing") : t("settings.gmail.remove")}
        </DangerButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-bg px-4 py-3.5">
      <GoogleGlyph />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-bold text-heading truncate">{gmail.label ?? gmail.email}</p>
        <p className="text-[12.5px] text-success mt-1">
          {t("settings.gmail.connectedStatus", {
            sync: (() => {
              const distance = syncedDistance(gmail.lastSyncedAt)
              return distance
                ? t("settings.gmail.syncedAgo", { distance })
                : t("settings.gmail.notSyncedYet")
            })(),
          })}
        </p>
      </div>
      <Button
        variant="successOutline"
        onClick={() => sync.mutate(gmail.id)}
        disabled={syncing}
        className="shrink-0"
      >
        {syncing ? t("settings.gmail.syncing") : t("settings.gmail.syncNow")}
      </Button>
      <DangerButton
        onClick={onDisconnect}
        disabled={disconnecting}
        className="shrink-0"
      >
        {disconnecting ? t("settings.gmail.disconnecting") : t("settings.gmail.disconnect")}
      </DangerButton>
    </div>
  )
}
