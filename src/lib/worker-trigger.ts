import { log } from "@/lib/posthog-server"

const GCP_JOB_VARS = ["GCP_PROJECT_ID", "GCP_REGION", "WORKER_JOB_NAME"] as const

// Validate that the queue-draining path is actually wired up. Run once at server
// startup (see instrumentation.ts) so a broken worker deployment surfaces at boot
// instead of silently swallowing every enqueued sync/export.
//
// Failure modes this guards against:
//  - WORKER_TRIGGER=cloudrun but a GCP var is missing → triggerBatchWorker() and
//    triggerExportBatch() log-and-return, so jobs pile up in Redis unconsumed.
//    This is an unrecoverable misconfig → throw and refuse to boot.
//  - Production with WORKER_TRIGGER unset → no Cloud Run Job is ever kicked off,
//    so on-demand syncs only drain on the daily batch (if that even exists). We
//    can't prove there's no external always-on worker, so warn loudly, don't throw.
export function assertWorkerConfig(): void {
  const trigger = process.env.WORKER_TRIGGER

  if (trigger === "cloudrun") {
    const missing = GCP_JOB_VARS.filter((v) => !process.env[v])
    if (missing.length > 0) {
      throw new Error(
        `WORKER_TRIGGER=cloudrun but missing required env var(s): ${missing.join(", ")}. ` +
          `The web tier cannot start the Cloud Run Job, so enqueued jobs would never drain.`
      )
    }
    return
  }

  if (process.env.NODE_ENV === "production") {
    log.error(
      "worker-config: WORKER_TRIGGER is not 'cloudrun' in production — enqueued Gmail syncs " +
        "and PDF exports will not be drained on demand. Set WORKER_TRIGGER=cloudrun (with " +
        `${GCP_JOB_VARS.join(", ")}) or run an always-on worker (npm run worker:start).`
    )
  }
}

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

// Kick off a one-shot PDF export build. Unlike triggerBatchWorker this does NOT
// touch Redis/BullMQ — the QUEUED ExportJob rows are the work list.
//
// Production (WORKER_TRIGGER=cloudrun): run the same Cloud Run Job with
// MODE=export, which drains pending export rows and exits. Local dev: run the
// builder in-process (fire-and-forget) so the flow works without Redis or a
// separate worker process. Errors are swallowed — the row stays QUEUED and the
// next trigger (or a manual run) will pick it up.
export async function triggerExportBatch(): Promise<void> {
  if (process.env.WORKER_TRIGGER !== "cloudrun") {
    // Dev/self-hosted: build inline without blocking the request.
    void import("@/workers/export-build")
      .then((m) => m.processPendingExports())
      .catch((err) =>
        log.error("triggerExportBatch: in-process build failed", {
          error: err instanceof Error ? err.message : String(err),
        })
      )
    return
  }

  const project = process.env.GCP_PROJECT_ID
  const region = process.env.GCP_REGION
  const jobName = process.env.WORKER_JOB_NAME

  if (!project || !region || !jobName) {
    log.error("triggerExportBatch: missing GCP_PROJECT_ID / GCP_REGION / WORKER_JOB_NAME")
    return
  }

  try {
    const { JobsClient } = await import("@google-cloud/run")
    const client = new JobsClient()
    await client.runJob({
      name: `projects/${project}/locations/${region}/jobs/${jobName}`,
      overrides: {
        containerOverrides: [{ env: [{ name: "MODE", value: "export" }] }],
      },
    })
  } catch (err) {
    log.error("triggerExportBatch: failed to start Cloud Run Job", {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
