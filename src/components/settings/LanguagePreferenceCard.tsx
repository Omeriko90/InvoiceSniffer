// Client component by import — only ever rendered from <SettingsPage>.
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/components/i18n/LocaleProvider"
import { LOCALES, LOCALE_LABELS, isValidLocale, type Locale } from "@/lib/i18n/config"

// Per-user UI language. The draft is held locally and only applied on Save,
// which flips the document dir/lang, updates the cookie, and persists to the DB.
export function LanguagePreferenceCard() {
  const { locale, setLocale, t } = useLocale()
  const [value, setValue] = useState<Locale>(locale)
  const dirty = value !== locale

  function save() {
    setLocale(value)
    toast.success(t("settings.language.saved"))
  }

  return (
    <Card className="h-full ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col h-full">
        <h2 className="text-base font-bold text-heading leading-none mb-1.5">
          {t("settings.language.title")}
        </h2>
        <p className="text-xs text-text-secondary mb-[18px] leading-[1.55]">
          {t("settings.language.description")}
        </p>

        <Select
          value={value}
          onValueChange={(v) => {
            if (isValidLocale(v)) setValue(v)
          }}
        >
          <SelectTrigger className="h-auto py-[7px] px-2.5 w-[160px] rounded border-border text-sm font-semibold text-text-primary">
            <SelectValue>{LOCALE_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>
                {LOCALE_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-auto pt-4">
          <Button onClick={save} disabled={!dirty}>
            {t("settings.language.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
