import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { listGmailCredentials } from "@/lib/gmail"
import { gmailSyncQueue, type GmailSyncJobData } from "@/lib/queues"
import { enforceRateLimit } from "@/lib/rate-limit"
import { triggerBatchWorker } from "@/lib/worker-trigger"
import { NextRequest, NextResponse } from "next/server"

// POST /api/gmail/sync — trigger a manual sync for one connected mailbox
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const { credentialId } = (await req.json().catch(() => ({}))) as { credentialId?: string }
  if (!credentialId) {
    return NextResponse.json({ error: "credentialId is required" }, { status: 400 })
  }

  const credential = await prisma.gmailCredential.findUnique({
    where: { id: credentialId },
    select: { organizationId: true, connected: true, syncToken: true },
  })

  // Authorize org ownership and ensure the mailbox is still connected
  if (!credential || credential.organizationId !== organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!credential.connected) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })
  }

  // Each sync fires a Cloud Run Job execution and a full mailbox scan; cap manual
  // triggers to 5/min per mailbox so repeated clicks can't drive up cost.
  const limited = await enforceRateLimit(`gmail-sync:${credentialId}`, 5, 60_000)
  if (limited) return limited

  const mode: GmailSyncJobData["mode"] = credential.syncToken ? "incremental" : "full"

  // Stable id (no timestamp) so rapid clicks / an overlap with the daily run
  // dedupe to one sync per mailbox instead of double-scanning Gmail. Caveat:
  // defaultJobOptions RETAINS settled jobs (removeOnComplete/removeOnFail
  // counts), and BullMQ ignores add() when a job with the id already exists — so
  // a completed/failed job under this id would silently block every future
  // click. Drop it first, but only once it's no longer in flight, so an
  // active/waiting/delayed job still dedupes as intended.
  const jobId = `sync-${credentialId}`
  const existing = await gmailSyncQueue().getJob(jobId)
  if (existing && ["completed", "failed"].includes(await existing.getState())) {
    await existing.remove()
  }

  const job = await gmailSyncQueue().add(
    "gmail:sync",
    { organizationId, credentialId, mode } satisfies GmailSyncJobData,
    { jobId }
  )

  // Fire the batch worker to process the job (prod: Cloud Run Job; dev: no-op —
  // the always-on worker handles it). Fire-and-forget; never fails the request.
  await triggerBatchWorker()

  return NextResponse.json({ jobId: job.id, mode })
}

// GET /api/gmail/sync — per-mailbox sync status for the org
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const credentials = await listGmailCredentials(session.user.organizationId)

  return NextResponse.json({
    accounts: credentials.map((c) => ({
      id: c.id,
      email: c.email,
      connected: true,
      lastSyncedAt: c.lastSyncedAt,
      hasSyncToken: !!c.syncToken,
    })),
  })
}
