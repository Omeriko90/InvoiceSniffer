// Client component by import — only ever rendered from <Topbar>.
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { queries } from "@/queries"
import { useT } from "@/components/i18n/LocaleProvider"

export function GmailSyncPill() {
  const t = useT()
  const { data } = useQuery({
    ...queries.gmail.status,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  if (!data || !data.hasAccounts || data.outOfSyncCount === 0) return null

  return (
    <Link
      href="/settings"
      title="See which mailbox needs reconnecting to resume detecting invoices"
      className="cursor-pointer"
    >
      <Badge className="h-auto gap-1.5 px-3 py-1.5 rounded-full bg-danger-bg border-danger-border text-xs font-medium text-danger hover:opacity-90 cursor-pointer">
        <AlertTriangle size={12} />
        {t("shell.gmail_sync.out_of_sync")}
      </Badge>
    </Link>
  )
}
