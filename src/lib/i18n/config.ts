// Locale configuration — the single source of truth for supported languages.
// Kept dependency-free so it can be imported from both server and client code.

export const LOCALES = ["en", "he"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

// Cookie the server reads to render the correct <html lang/dir> on first paint.
export const LOCALE_COOKIE = "locale"

// Human-facing labels for the language picker (each shown in its own language).
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  he: "עברית",
}

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr"
}
