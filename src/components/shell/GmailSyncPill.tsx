// Client component by import — only ever rendered from <Topbar>.
import { AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { queries } from "@/queries"

// Self-fetching Gmail status pill. Shows a red "out of sync" link (to reconnect)
// when any mailbox has been soft-disconnected (e.g. its refresh token
// expired/was revoked); renders nothing when mailboxes are healthy or none exist.
export function GmailSyncPill() {
  const { data } = useQuery({
    ...queries.gmail.status,
    // Cheap poll so the pill flips to "out of sync" shortly after a failed
    // refresh soft-disconnects a mailbox, without a manual reload.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  if (!data || !data.hasAccounts || data.outOfSyncCount === 0) return null

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
