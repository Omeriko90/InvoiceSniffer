"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { track } from "@/lib/analytics"
import { useT } from "@/components/i18n/LocaleProvider"
import type { TranslationKey } from "@/lib/i18n/translate"

// Maps each `gmail_error` code the OAuth callback can redirect with (see
// src/app/api/gmail/callback/route.ts) to its localized title/description keys.
// `access_denied` comes from Google itself when the user declines consent.
// Keys are resolved at display time since this map lives at module scope.
const ERROR_KEYS: Record<string, { title: string; description: string }> = {
  account_limit: {
    title: "settings.gmail.error.accountLimit.title",
    description: "settings.gmail.error.accountLimit.description",
  },
  access_denied: {
    title: "settings.gmail.error.accessDenied.title",
    description: "settings.gmail.error.accessDenied.description",
  },
  token_exchange_failed: {
    title: "settings.gmail.error.generic.title",
    description: "settings.gmail.error.tokenExchangeFailed.description",
  },
  no_tokens: {
    title: "settings.gmail.error.generic.title",
    description: "settings.gmail.error.noTokens.description",
  },
  missing_params: {
    title: "settings.gmail.error.generic.title",
    description: "settings.gmail.error.missingParams.description",
  },
  invalid_state: {
    title: "settings.gmail.error.generic.title",
    description: "settings.gmail.error.invalidState.description",
  },
}

const FALLBACK_ERROR_KEYS = {
  title: "settings.gmail.error.generic.title",
  description: "settings.gmail.error.fallback.description",
} as const

/**
 * Reads the `gmail_connected` / `gmail_error` query params set by the OAuth
 * callback, surfaces them as a toast, then strips them from the URL so a
 * refresh doesn't re-fire the toast. Renders nothing.
 */
export function GmailConnectResult() {
  const t = useT()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const shown = useRef(false)

  const connected = searchParams.get("gmail_connected")
  const error = searchParams.get("gmail_error")

  useEffect(() => {
    if (shown.current) return
    if (!connected && !error) return
    shown.current = true

    if (connected) {
      track("account_connected")
      toast.success(t("settings.gmail.connectedToast.title"), {
        description: t("settings.gmail.connectedToast.description"),
      })
    } else if (error) {
      const keys = ERROR_KEYS[error] ?? FALLBACK_ERROR_KEYS
      toast.error(t(keys.title as TranslationKey), {
        description: t(keys.description as TranslationKey),
      })
    }

    // Drop the params so the toast doesn't reappear on refresh or navigation.
    router.replace(pathname, { scroll: false })
  }, [connected, error, router, pathname, t])

  return null
}
