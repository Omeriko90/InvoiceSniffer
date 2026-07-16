import type { Instrumentation } from "next"

// Runs once when the Next.js server process boots. Validate the worker-drain
// config here so a misconfigured deployment fails fast at startup rather than
// silently dropping every enqueued sync/export.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { assertWorkerConfig } = await import("@/lib/worker-trigger")
  assertWorkerConfig()
}

// Server-side errors from route handlers and server components → PostHog.
// Runs in the Next.js server process; the worker has its own capture hooks.
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  // posthog-node pulls in Node APIs, so keep the import out of the edge runtime
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { captureServerException, getPostHog } = await import("@/lib/posthog-server")
  captureServerException(err, "server", {
    path: request.path,
    method: request.method,
  })
  await getPostHog()?.flush()
}
