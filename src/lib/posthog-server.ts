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

type LogLevel = "info" | "warn" | "error"

// Structured server logger. Always writes to stdout (the worker/console is
// the primary local view) and, when PostHog is active, mirrors the line as a
// `$server_log` event so logs are searchable in the PostHog Logs view.
// posthog-node has no dedicated log API, so we model logs as capture events.
export function logServer(level: LogLevel, message: string, properties?: Record<string, unknown>) {
  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  if (properties) consoleFn(message, properties)
  else consoleFn(message)

  getPostHog()?.capture({
    distinctId: "server",
    event: "$server_log",
    properties: { level, message, ...properties },
  })
}

export const log = {
  info: (message: string, properties?: Record<string, unknown>) => logServer("info", message, properties),
  warn: (message: string, properties?: Record<string, unknown>) => logServer("warn", message, properties),
  error: (message: string, properties?: Record<string, unknown>) => logServer("error", message, properties),
}

export async function shutdownPostHog() {
  await client?.shutdown()
  client = null
}
