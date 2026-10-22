import { he } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"
import type { Locale } from "./config"

// Maps the app locale to a date-fns locale. `undefined` means date-fns's
// built-in default (en-US), so English needs no bundled locale object.
export function dateFnsLocale(locale: Locale): DateFnsLocale | undefined {
  return locale === "he" ? he : undefined
}
