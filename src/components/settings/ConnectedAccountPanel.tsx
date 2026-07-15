// Client component by import — only ever rendered from <GmailConnectionCard>.
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="flex items-center gap-3 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-[14px]">
        <AlertTriangle size={18} className="shrink-0 text-[#B45309]" />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-[700] text-heading truncate">{gmail.label ?? gmail.email}</p>
          <p className="text-[12.5px] text-[#B45309] mt-[2px]">
            Out of sync — Gmail access expired. Reconnect to resume detecting invoices.
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = "/api/gmail/connect" }}
          className="shrink-0 h-auto text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[14px] py-[7px] shadow-primary hover:bg-primary hover:opacity-90"
        >
          Reconnect
        </Button>
        <Button
          variant="outline"
          onClick={onDisconnect}
          disabled={disconnecting}
          className="shrink-0 h-auto text-[13px] font-[600] text-danger bg-surface border-[#FECACA] rounded-[9px] px-[14px] py-[7px] hover:bg-danger-bg hover:text-danger disabled:opacity-60"
        >
          {disconnecting ? "Removing…" : "Remove"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[#BBE7CD] bg-success-bg px-4 py-[14px]">
      <GoogleGlyph />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-[700] text-heading truncate">{gmail.label ?? gmail.email}</p>
        <p className="text-[12.5px] text-[#059669] mt-[2px]">
          Connected · read-only · {syncedLabel(gmail.lastSyncedAt)}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => sync.mutate(gmail.id)}
        disabled={syncing}
        className="shrink-0 h-auto text-[13px] font-[600] text-[#047857] bg-surface border-[#BBE7CD] rounded-[9px] px-[14px] py-[7px] hover:bg-success-bg hover:text-[#047857] disabled:opacity-60"
      >
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
      <Button
        variant="outline"
        onClick={onDisconnect}
        disabled={disconnecting}
        className="shrink-0 h-auto text-[13px] font-[600] text-danger bg-surface border-[#FECACA] rounded-[9px] px-[14px] py-[7px] hover:bg-danger-bg hover:text-danger disabled:opacity-60"
      >
        {disconnecting ? "Disconnecting…" : "Disconnect"}
      </Button>
    </div>
  )
}
