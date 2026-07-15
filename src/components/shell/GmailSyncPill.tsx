// Client component by import — only ever rendered from <Topbar>.
import { AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { queries } from "@/queries"
import { syncedLabel } from "@/components/settings/helpers"

// Self-fetching Gmail status pill. Green when all mailboxes are healthy; a red
// "out of sync" link (to reconnect) when any mailbox has been soft-disconnected
// (e.g. its refresh token expired/was revoked); nothing when no account exists.
export function GmailSyncPill() {
  const { data } = useQuery({
    ...queries.gmail.status,
    // Cheap poll so the pill flips to "out of sync" shortly after a failed
    // refresh soft-disconnects a mailbox, without a manual reload.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  if (!data || !data.hasAccounts) return null

  if (data.outOfSyncCount > 0) {
    return (
      <button
        type="button"
        onClick={() => { window.location.href = "/api/gmail/connect" }}
        title="Reconnect Gmail to resume detecting invoices"
        className="appearance-none bg-transparent border-0 p-0 cursor-pointer"
      >
        <Badge className="h-auto gap-1.5 px-3 py-1.5 rounded-full bg-danger-bg border-[#FECACA] text-[12px] font-medium text-danger hover:opacity-90 cursor-pointer">
          <AlertTriangle size={12} />
          Gmail out of sync · reconnect
        </Badge>
      </button>
    )
  }

  const label = data.lastSyncedAt ? `Gmail ${syncedLabel(data.lastSyncedAt)}` : "Gmail connected"
  return (
    <Badge className="h-auto gap-1.5 px-3 py-1.5 rounded-full bg-success-bg border-[#BBF7D0] text-[12px] font-medium text-[#059669]">
      <span className="w-1.5 h-1.5 rounded-full bg-success" />
      {label}
    </Badge>
  )
}
