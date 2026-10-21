// Client component by import — only ever rendered from <ReconcileClient>.
import Link from "next/link"
import { GitMerge } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
import { Button } from "@/components/ui/button"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"

export function EmptyState() {
  const t = useT()
  return (
    <EmptyStateShell
      icon={GitMerge}
      title={t("reconcile.empty.title")}
      description={t("reconcile.empty.description")}
      action={
        <Button
          variant="gradientSky"
          nativeButton={false}
          render={<Link href="/reconcile" />}
        >
          {t("reconcile.empty.importCsv")}
        </Button>
      }
    />
  )
}
