import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { triggerExportBatch } from "@/lib/worker-trigger"
import { NextRequest, NextResponse } from "next/server"

// POST /api/exports — enqueue an async merged-PDF export of the selected invoices.
// The ExportJob row is the work item; a Cloud Run Job (MODE=export) builds it.
type Body = {
  invoiceIds?: string[]
  dateRangeStart?: string
  dateRangeEnd?: string
}

const MAX_INVOICES = 2000

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const body = (await req.json().catch(() => ({}))) as Body
  const invoiceIds = Array.isArray(body.invoiceIds) ? body.invoiceIds : []
  if (invoiceIds.length === 0) {
    return NextResponse.json({ error: "No invoices selected" }, { status: 400 })
  }
  if (invoiceIds.length > MAX_INVOICES) {
    return NextResponse.json({ error: `Too many invoices (max ${MAX_INVOICES})` }, { status: 400 })
  }

  // Each build fetches attachments from Gmail and fires a Cloud Run Job — cap it.
  const limited = await enforceRateLimit(`pdf-export:${organizationId}`, 10, 60_000)
  if (limited) return limited

  const now = new Date()
  const start = body.dateRangeStart ? new Date(body.dateRangeStart) : now
  const end = body.dateRangeEnd ? new Date(body.dateRangeEnd) : now

  const job = await prisma.exportJob.create({
    data: {
      organizationId,
      format: "PDF",
      dateRangeStart: start,
      dateRangeEnd: end,
      invoiceIds,
      fields: [],
      status: "QUEUED",
    },
    select: { id: true },
  })

  await triggerExportBatch()

  return NextResponse.json({ exportJobId: job.id })
}

// GET /api/exports — export history for the org (newest first).
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await prisma.exportJob.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      format: true,
      status: true,
      fileName: true,
      dateRangeStart: true,
      dateRangeEnd: true,
      skippedCount: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  return NextResponse.json({ exports: jobs })
}
