import { log } from "@/lib/posthog-server"

// Kick off a one-shot drain of the BullMQ queues.
//
// In production (WORKER_TRIGGER=cloudrun) this executes the Cloud Run Job with
// MODE=drain — it runs independently of this request and drains whatever the
// caller just enqueued. In local dev the always-on `npm run worker` process is
// already consuming the queue, so this is a no-op.
//
// Errors are swallowed: the sync job is already safely enqueued in Redis, so a
// trigger failure just delays processing until the next daily run — it must not
// fail the user's request.
export async function triggerBatchWorker(): Promise<void> {
  if (process.env.WORKER_TRIGGER !== "cloudrun") return

  const project = process.env.GCP_PROJECT_ID
  const region = process.env.GCP_REGION
  const jobName = process.env.WORKER_JOB_NAME

  if (!project || !region || !jobName) {
    log.error("triggerBatchWorker: missing GCP_PROJECT_ID / GCP_REGION / WORKER_JOB_NAME")
    return
  }

  try {
    // Dynamic import so the web bundle only loads the GCP client when it's
    // actually used (prod), and local/dev builds don't need the dependency path.
    const { JobsClient } = await import("@google-cloud/run")
    const client = new JobsClient()

    // runJob returns a long-running operation; we intentionally do NOT await the
    // operation's completion — only the create call that starts the execution.
    await client.runJob({
      name: `projects/${project}/locations/${region}/jobs/${jobName}`,
      overrides: {
        containerOverrides: [{ env: [{ name: "MODE", value: "drain" }] }],
      },
    })
  } catch (err) {
    log.error("triggerBatchWorker: failed to start Cloud Run Job", {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
