// Client component by import — only ever rendered from the Alerts page.
import { BellOff } from "lucide-react"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"
import { useT } from "@/components/i18n/LocaleProvider"

export function EmptyState({ filtered }: { filtered: boolean }) {
  const t = useT()
  return (
    <EmptyStateShell
      className="max-w-[880px]"
      icon={BellOff}
      title={filtered ? t("alerts.empty.filteredTitle") : t("alerts.empty.title")}
      description={
        filtered
          ? t("alerts.empty.filteredDescription")
          : t("alerts.empty.description")
      }
    />
  )
}
