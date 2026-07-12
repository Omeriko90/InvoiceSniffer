import posthog from "posthog-js"

// Runs once before hydration. Autocapture (clicks, form submits), pageviews,
// session replay, and unhandled-exception capture all ride on this init.
if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === "production") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    defaults: "2025-05-24", // SPA pageview/pageleave tracking for the App Router
    capture_exceptions: true,
    session_recording: {
      maskAllInputs: true, // invoice amounts and vendor data stay out of replays
    },
  })
}
