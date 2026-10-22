import { format } from "date-fns"
import type { Locale as DateFnsLocale } from "date-fns"

// Shared date formatting so "MMM d, yyyy" / "MMM d" aren't re-typed everywhere.
// Pass a date-fns locale (from useFmtDate) to localize month names.
export function fmtDate(iso: string, locale?: DateFnsLocale): string {
  return format(new Date(iso), "MMM d, yyyy", { locale })
}

export function fmtDateShort(iso: string, locale?: DateFnsLocale): string {
  return format(new Date(iso), "MMM d", { locale })
}
