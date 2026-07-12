"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

// Ties the anonymous PostHog session to the signed-in user + org.
// Rendered from the authed layout so it runs on every app page.
export function PostHogIdentify({
  userId,
  email,
  name,
  organizationId,
}: {
  userId: string
  email: string
  name?: string | null
  organizationId: string
}) {
  useEffect(() => {
    if (!posthog.__loaded) return
    posthog.identify(userId, { email, name: name ?? undefined })
    posthog.group("organization", organizationId)
  }, [userId, email, name, organizationId])

  return null
}
