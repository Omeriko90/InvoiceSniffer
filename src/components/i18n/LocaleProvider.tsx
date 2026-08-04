"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { dictionaries } from "@/lib/i18n/dictionary"
import { t as translate, type TranslationKey, type TranslateParams } from "@/lib/i18n/translate"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirForLocale,
  type Locale,
} from "@/lib/i18n/config"

type TranslateFn = (key: TranslationKey, params?: TranslateParams) => string

type LocaleContextValue = {
  locale: Locale
  dir: "ltr" | "rtl"
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

// One-year cookie so the server can render the correct lang/dir before hydration.
function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

// Both dictionaries are bundled (small, ~250 strings) so switching is instant and
// needs no network round-trip. `initialLocale` comes from the server (cookie/DB),
// which keeps the first paint flash-free.
export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    // Flip the document immediately for a responsive switch...
    document.documentElement.lang = next
    document.documentElement.dir = dirForLocale(next)
    // ...persist for the next SSR render...
    writeLocaleCookie(next)
    // ...and save to the user's account (best-effort; cookie already covers SSR).
    void fetch("/api/user/language", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {})
  }, [])

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[locale]
    return {
      locale,
      dir: dirForLocale(locale),
      setLocale,
      t: (key, params) => translate(dict, key, params),
    }
  }, [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider")
  return ctx
}

// Convenience hook returning just the bound translate function.
export function useT(): TranslateFn {
  return useLocale().t
}
