"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

// Copy for each `integration_error` code the OAuth callback can redirect with
// (see src/app/api/integrations/[provider]/callback/route.ts).
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  integration_limit: {
    title: "Integration limit reached",
    description: "Disconnect an integration or upgrade your plan to connect another.",
  },
  access_denied: {
    title: "Connection cancelled",
    description: "You declined the permission request, so nothing was connected.",
  },
  token_exchange_failed: {
    title: "Couldn't connect",
    description: "The provider sign-in didn't complete. Please try again.",
  },
  invalid_state: {
    title: "Couldn't connect",
    description: "The sign-in link expired or was invalid. Please try again.",
  },
  not_oauth: {
    title: "Couldn't connect",
    description: "This provider connects with an API key, not sign-in.",
  },
  unknown_provider: {
    title: "Couldn't connect",
    description: "That integration isn't available.",
  },
}

const FALLBACK_ERROR = {
  title: "Couldn't connect",
  description: "Something went wrong connecting the integration. Please try again.",
}

// Reads the `integration_connected` / `integration_error` query params set by
// the OAuth callback, surfaces them as a toast, then strips them from the URL.
export function IntegrationConnectResult() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const shown = useRef(false)

  const connected = searchParams.get("integration_connected")
  const error = searchParams.get("integration_error")

  useEffect(() => {
    if (shown.current) return
    if (!connected && !error) return
    shown.current = true

    if (connected) {
      toast.success("Integration connected", {
        description: "We'll start importing your expenses shortly.",
      })
    } else if (error) {
      const { title, description } = ERROR_MESSAGES[error] ?? FALLBACK_ERROR
      toast.error(title, { description })
    }

    router.replace(pathname, { scroll: false })
  }, [connected, error, router, pathname])

  return null
}
