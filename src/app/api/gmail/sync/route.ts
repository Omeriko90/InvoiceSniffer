import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { gmailSyncQueue, type GmailSyncJobData } from "@/lib/queues"
import { NextRequest, NextResponse } from "next/server"

// POST /api/gmail/sync — trigger a manual sync
export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { gmailConnected: true, gmailSyncToken: true },
  })

  if (!org?.gmailConnected) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })
  }

  const mode: GmailSyncJobData["mode"] = org.gmailSyncToken ? "incremental" : "full"

  const job = await gmailSyncQueue.add(
    "gmail:sync",
    { organizationId, mode } satisfies GmailSyncJobData,
    { jobId: `sync:${organizationId}:${Date.now()}` }
  )

  return NextResponse.json({ jobId: job.id, mode })
}

// GET /api/gmail/sync — check sync status
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { gmailConnected: true, lastSyncedAt: true, gmailSyncToken: true },
  })

  return NextResponse.json({
    connected: org?.gmailConnected ?? false,
    lastSyncedAt: org?.lastSyncedAt ?? null,
    hasSyncToken: !!org?.gmailSyncToken,
  })
}
