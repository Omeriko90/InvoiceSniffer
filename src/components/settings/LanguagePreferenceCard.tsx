// Client component by import — only ever rendered from <SettingsPage>.
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/components/i18n/LocaleProvider"
import { LOCALES, LOCALE_LABELS, isValidLocale } from "@/lib/i18n/config"

// Per-user UI language. Switching is applied instantly (LocaleProvider flips the
// document dir/lang, updates the cookie, and persists to the account); there is
// no separate save step.
export function LanguagePreferenceCard() {
  const { locale, setLocale, t } = useLocale()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-bold text-heading leading-none mb-[6px]">
          {t("settings.language.title")}
        </h2>
        <p className="text-[12.5px] text-text-secondary mb-[18px] leading-[1.55]">
          {t("settings.language.description")}
        </p>

        <Select
          value={locale}
          onValueChange={(v) => {
            if (!isValidLocale(v) || v === locale) return
            setLocale(v)
            toast.success(t("settings.language.saved"))
          }}
        >
          <SelectTrigger className="h-auto py-[7px] px-[10px] w-[160px] rounded border-border text-[13px] font-[600] text-text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>
                {LOCALE_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
