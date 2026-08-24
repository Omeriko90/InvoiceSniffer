// Client component by import — only ever rendered from <GmailConnectionCard>.
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DangerButton } from "@/components/ui/danger-button"
import type { GmailConnection } from "@/api-types/settings"
import { useGmailSync } from "@/hooks/useGmailSync"
import { GoogleGlyph } from "./GoogleGlyph"
import { syncedLabel } from "./helpers"

interface ConnectedAccountPanelProps {
  gmail: GmailConnection
  onDisconnect: () => void
  disconnecting: boolean
}

export function ConnectedAccountPanel({ gmail, onDisconnect, disconnecting }: ConnectedAccountPanelProps) {
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
            Out of sync — Gmail access expired. Reconnect to resume detecting invoices.
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = "/api/gmail/connect" }}
          className="shrink-0"
        >
          Reconnect
        </Button>
        <DangerButton
          onClick={onDisconnect}
          disabled={disconnecting}
          className="shrink-0"
        >
          {disconnecting ? "Removing…" : "Remove"}
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
          Connected · read-only · {syncedLabel(gmail.lastSyncedAt)}
        </p>
      </div>
      <Button
        variant="successOutline"
        onClick={() => sync.mutate(gmail.id)}
        disabled={syncing}
        className="shrink-0"
      >
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
      <DangerButton
        onClick={onDisconnect}
        disabled={disconnecting}
        className="shrink-0"
      >
        {disconnecting ? "Disconnecting…" : "Disconnect"}
      </DangerButton>
    </div>
  )
}
