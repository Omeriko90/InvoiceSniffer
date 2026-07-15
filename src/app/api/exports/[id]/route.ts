import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET /api/exports/[id] — status poll for a single export job. Never returns the
// file itself; the shell poller uses this to drive the "ready" toast.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const job = await prisma.exportJob.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, status: true, format: true, fileName: true, skippedCount: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    id: job.id,
    status: job.status,
    format: job.format,
    fileName: job.fileName,
    skippedCount: job.skippedCount,
    ready: job.status === "READY",
  })
}
