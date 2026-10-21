// Client component by import — only ever rendered from auth forms.
import { Separator } from "@/components/ui/separator"
import { useT } from "@/components/i18n/LocaleProvider"

export function OrDivider() {
  const t = useT()
  return (
    <div className="flex items-center gap-3 mb-5">
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-dim">{t("auth.divider.or")}</span>
      <Separator className="flex-1" />
    </div>
  )
}
