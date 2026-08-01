"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

// Friendly copy for each `gmail_error` code the OAuth callback can redirect
// with (see src/app/api/gmail/callback/route.ts). `access_denied` comes from
// Google itself when the user declines the consent screen.
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  account_limit: {
    title: "Mailbox limit reached",
    description: "Disconnect a mailbox or upgrade your plan to connect another.",
  },
  access_denied: {
    title: "Gmail connection cancelled",
    description: "You declined the permission request, so nothing was connected.",
  },
  token_exchange_failed: {
    title: "Couldn't connect Gmail",
    description: "Google sign-in didn't complete. Please try again.",
  },
  no_tokens: {
    title: "Couldn't connect Gmail",
    description: "Google didn't grant offline access. Try again and allow it when asked.",
  },
  missing_params: {
    title: "Couldn't connect Gmail",
    description: "The sign-in link was incomplete. Please start over.",
  },
  invalid_state: {
    title: "Couldn't connect Gmail",
    description: "The sign-in link expired or was invalid. Please try again.",
  },
}

const FALLBACK_ERROR = {
  title: "Couldn't connect Gmail",
  description: "Something went wrong connecting the mailbox. Please try again.",
}

/**
 * Reads the `gmail_connected` / `gmail_error` query params set by the OAuth
 * callback, surfaces them as a toast, then strips them from the URL so a
 * refresh doesn't re-fire the toast. Renders nothing.
 */
export function GmailConnectResult() {
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
      toast.success("Gmail connected", {
        description: "We'll start detecting invoices shortly.",
      })
    } else if (error) {
      const { title, description } = ERROR_MESSAGES[error] ?? FALLBACK_ERROR
      toast.error(title, { description })
    }

    // Drop the params so the toast doesn't reappear on refresh or navigation.
    router.replace(pathname, { scroll: false })
  }, [connected, error, router, pathname])

  return null
}
