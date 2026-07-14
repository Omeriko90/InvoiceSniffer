// Client component by import — only ever rendered from <InvoicesClient>.
import Link from "next/link"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGmailSync } from "@/hooks/useGmailSync"
import { useSettings } from "@/hooks/useSettings"

export function EmptyState() {
  const sync = useGmailSync()
  const { data } = useSettings()
  const accounts = data?.gmails ?? []
  const hasAccount = accounts.length > 0

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-14 h-14 rounded-xl bg-[#F1F3F8] flex items-center justify-center mb-4">
        <FileText size={26} strokeWidth={1.5} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">No invoices yet</p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6] mb-6">
        Once your Gmail is connected, detected invoices will appear here automatically. Nothing has been scanned yet.
      </p>
      {hasAccount ? (
        <Button
          onClick={() => accounts.forEach((a) => sync.mutate(a.id))}
          disabled={sync.isPending}
          className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
          style={{
            background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
            boxShadow: "0 4px 12px rgba(122,167,255,.3)",
          }}
        >
          {sync.isPending ? "Starting…" : "Run a Gmail sync"}
        </Button>
      ) : (
        <Button
          nativeButton={false}
          render={<Link href="/api/gmail/connect" />}
          className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
          style={{
            background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
            boxShadow: "0 4px 12px rgba(122,167,255,.3)",
          }}
        >
          Connect Gmail
        </Button>
      )}
    </div>
  )
}
