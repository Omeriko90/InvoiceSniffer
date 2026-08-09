// Client component by import — only ever rendered from <InvoicesClient>.
import Link from "next/link"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/components/buttons"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"
import { useGmailSync } from "@/hooks/useGmailSync"
import { useSettings } from "@/hooks/useSettings"

const ctaClass = "h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
const ctaStyle = {
  background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
  boxShadow: "0 4px 12px rgba(122,167,255,.3)",
}

export function EmptyState() {
  const sync = useGmailSync()
  const { data } = useSettings()
  const accounts = data?.gmails ?? []
  const hasAccount = accounts.length > 0

  return (
    <EmptyStateShell
      icon={FileText}
      title="No invoices yet"
      description="Once your Gmail is connected, detected invoices will appear here automatically. Nothing has been scanned yet."
      action={
        hasAccount ? (
          <Button
            onClick={() => accounts.forEach((a) => sync.mutate(a.id))}
            disabled={sync.isPending}
            className={ctaClass}
            style={ctaStyle}
          >
            {sync.isPending ? "Starting…" : "Run a Gmail sync"}
          </Button>
        ) : (
          <Link
            href="/api/gmail/connect"
            className={`inline-flex items-center justify-center ${ctaClass}`}
            style={ctaStyle}
          >
            Connect Gmail
          </Link>
        )
      }
    />
  )
}
