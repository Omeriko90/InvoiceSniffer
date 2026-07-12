import { PostHog } from "posthog-node"

// Server-side PostHog client for API routes and workers. Events flush in
// batches; call shutdownPostHog() before process exit so none are dropped.
let client: PostHog | null = null

export function getPostHog(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NODE_ENV !== "production") return null
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      flushAt: 1, // low traffic — send immediately rather than batching
    })
  }
  return client
}

export function captureServerException(error: unknown, distinctId: string, properties?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error))
  getPostHog()?.captureException(err, distinctId, properties)
}

export async function shutdownPostHog() {
  await client?.shutdown()
  client = null
}
