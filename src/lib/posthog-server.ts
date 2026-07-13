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

// OTLP severity numbers (OpenTelemetry logs data model)
const SEVERITY: Record<LogLevel, { number: number; text: string }> = {
  info: { number: 9, text: "INFO" },
  warn: { number: 13, text: "WARN" },
  error: { number: 17, text: "ERROR" },
}

// Convert a properties object into OTLP attribute entries (values stringified)
function toOtlpAttributes(properties: Record<string, unknown>) {
  return Object.entries(properties).map(([key, value]) => ({
    key,
    value: { stringValue: typeof value === "string" ? value : JSON.stringify(value) },
  }))
}

// Ships a log line to PostHog's Logs product via OTLP-over-HTTP (JSON). This
// feeds the actual Logs view — posthog-node's capture API only creates events,
// so we POST the OTLP payload directly rather than pull in the OTel SDK.
// Fire-and-forget: logging must never block or throw into the caller.
function shipLogToPostHog(level: LogLevel, message: string, properties?: Record<string, unknown>) {
  // Authenticate with a server-only token when available. NEXT_PUBLIC_* vars are
  // inlined into the client bundle and world-readable, so using one as a Bearer
  // lets anyone POST arbitrary log lines. Fall back to the public key only so
  // logging keeps working where POSTHOG_LOGS_TOKEN isn't configured yet.
  const token = process.env.POSTHOG_LOGS_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!token || process.env.NODE_ENV !== "production") return

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com"
  const severity = SEVERITY[level]
  const body = {
    resourceLogs: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: "invoicesniffer" } }],
        },
        scopeLogs: [
          {
            logRecords: [
              {
                timeUnixNano: `${Date.now()}000000`,
                severityNumber: severity.number,
                severityText: severity.text,
                body: { stringValue: message },
                attributes: toOtlpAttributes(properties ?? {}),
              },
            ],
          },
        ],
      },
    ],
  }

  fetch(`${host}/i/v1/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).catch(() => {
    // Never let a logging transport failure surface to the caller
  })
}

// Structured server logger. Always writes to stdout (the worker/console is the
// primary local view) and, in production, ships the line to PostHog's Logs view.
export function logServer(level: LogLevel, message: string, properties?: Record<string, unknown>) {
  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  if (properties) consoleFn(message, properties)
  else consoleFn(message)

  shipLogToPostHog(level, message, properties)
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
