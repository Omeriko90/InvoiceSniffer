// Client component by import — only ever rendered from <InvoicesClient>.
import Link from "next/link"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"
import { useGmailSync } from "@/hooks/useGmailSync"
import { useSettings } from "@/hooks/useSettings"
import { useT } from "@/components/i18n/LocaleProvider"

const ctaClass = "h-auto px-[18px] py-2.5 rounded-[10px] text-sm font-bold text-white border-0 bg-gradient-sky"
const ctaStyle = {
  boxShadow: "0 4px 12px rgba(122,167,255,.3)",
}

export function EmptyState() {
  const t = useT()
  const sync = useGmailSync()
  const { data } = useSettings()
  const accounts = data?.gmails ?? []
  const hasAccount = accounts.length > 0

  return (
    <EmptyStateShell
      icon={FileText}
      title={t("invoices.empty.title")}
      description={t("invoices.empty.description")}
      action={
        hasAccount ? (
          <Button
            onClick={() => accounts.forEach((a) => sync.mutate(a.id))}
            disabled={sync.isPending}
            className={ctaClass}
            style={ctaStyle}
          >
            {sync.isPending ? t("invoices.empty.syncing") : t("invoices.empty.runSync")}
          </Button>
        ) : (
          <Button
            nativeButton={false}
            render={<Link href="/api/gmail/connect" />}
            className={ctaClass}
            style={ctaStyle}
          >
            {t("invoices.empty.connectGmail")}
          </Button>
        )
      }
    />
  )
}
