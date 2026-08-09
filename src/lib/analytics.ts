import posthog from "posthog-js"

// Named, semantic PostHog events layered on top of autocapture. snake_case per
// PostHog convention — extend this union as new events get instrumented.
export type AnalyticsEvent =
  | "nav_item_clicked"
  | "dialog_opened"
  | "invoice_exported"
  | "reconcile_match_confirmed"
  | "account_connected"
  | "account_disconnected"
  | "fixed_expense_saved"
  | "invoice_marked_fixed"
  | "invoice_unlinked"

export type AnalyticsProps = Record<string, unknown>

// PostHog only initializes in production (see instrumentation-client.ts), so the
// __loaded guard makes every call a safe no-op in dev — no extra gating needed.
export function track(event: AnalyticsEvent, properties?: AnalyticsProps) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties)
  }
}

// Convenience shape accepted by the shared UI primitives' `analytics` prop.
export type AnalyticsInput = AnalyticsEvent | { event: AnalyticsEvent; properties?: AnalyticsProps }

export function trackInput(analytics: AnalyticsInput) {
  if (typeof analytics === "string") {
    track(analytics)
  } else {
    track(analytics.event, analytics.properties)
  }
}
