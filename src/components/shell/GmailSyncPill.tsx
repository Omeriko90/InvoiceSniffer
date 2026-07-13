// Client component by import — only ever rendered from <Topbar>.
import { Badge } from "@/components/ui/badge"

export function GmailSyncPill({ gmailSyncedAt }: { gmailSyncedAt?: string | null }) {
  return (
    <Badge className="h-auto gap-1.5 px-3 py-1.5 rounded-full bg-success-bg border-[#BBF7D0] text-[12px] font-medium text-[#059669]">
      <span className="w-1.5 h-1.5 rounded-full bg-success" />
      {gmailSyncedAt ? `Gmail synced · ${gmailSyncedAt}` : "Gmail synced"}
    </Badge>
  )
}
