// Client component by import — only ever rendered from <GmailConnectionCard>.
import { Button } from "@/components/ui/button"
import type { GmailConnection } from "@/api-types/settings"
import { GoogleGlyph } from "./GoogleGlyph"
import { syncedLabel } from "./helpers"

interface ConnectedAccountPanelProps {
  gmail: GmailConnection
  onDisconnect: () => void
  disconnecting: boolean
}

export function ConnectedAccountPanel({ gmail, onDisconnect, disconnecting }: ConnectedAccountPanelProps) {
  if (gmail.connected) {
    return (
      <div className="flex items-center gap-3 rounded-[12px] border border-[#BBE7CD] bg-success-bg px-4 py-[14px]">
        <GoogleGlyph />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-[700] text-heading truncate">{gmail.email}</p>
          <p className="text-[12.5px] text-[#059669] mt-[2px]">
            Connected · read-only · {syncedLabel(gmail.lastSyncedAt)}
          </p>
        </div>
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

  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-border bg-hover px-4 py-[14px]">
      <GoogleGlyph />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-[700] text-heading">Not connected</p>
        <p className="text-[12.5px] text-text-secondary mt-[2px]">
          Connect Gmail to detect invoices automatically
        </p>
      </div>
      <Button
        className="shrink-0 h-auto text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[14px] py-[7px] shadow-primary hover:bg-primary hover:opacity-90"
        nativeButton={false}
        render={<a href="/api/gmail/connect" />}
      >
        Connect
      </Button>
    </div>
  )
}
