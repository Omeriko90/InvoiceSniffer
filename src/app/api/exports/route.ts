import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteExportObjects } from "@/lib/r2"
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
      invoiceIds: true,
      skippedCount: true,
      skipped: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  // Expose the count (not the raw id array) plus the per-file skip detail so the
  // history accordion can explain what was left out of each export.
  const exports = jobs.map(({ invoiceIds, ...job }) => ({
    ...job,
    invoiceCount: invoiceIds.length,
  }))

  return NextResponse.json({ exports })
}

// DELETE /api/exports — bulk-remove exports by id. R2 objects go in one
// DeleteObjects call; a DB row is only removed once its object is confirmed gone
// (or the job never had a file), so a failed R2 delete never orphans its file.
const MAX_BULK_DELETE = 200

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const body = (await req.json().catch(() => ({}))) as { ids?: unknown }
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : []
  if (ids.length === 0) {
    return NextResponse.json({ error: "No exports selected" }, { status: 400 })
  }
  if (ids.length > MAX_BULK_DELETE) {
    return NextResponse.json({ error: `Too many exports (max ${MAX_BULK_DELETE})` }, { status: 400 })
  }

  // Org scoping here is what enforces ownership — ids from another org drop out.
  const jobs = await prisma.exportJob.findMany({
    where: { id: { in: ids }, organizationId },
    select: { id: true, r2Key: true },
  })

  const withKey = jobs.filter((j): j is { id: string; r2Key: string } => Boolean(j.r2Key))
  const withoutKey = jobs.filter((j) => !j.r2Key)

  // Rows with a file: only delete the DB row if R2 confirmed the object is gone.
  // An R2 failure leaves both the object and its row so it can be retried.
  let deletedKeys: string[] = []
  if (withKey.length > 0) {
    try {
      deletedKeys = (await deleteExportObjects(withKey.map((j) => j.r2Key))).deleted
    } catch (err) {
      console.error("Bulk R2 delete failed:", err)
    }
  }
  const deletedKeySet = new Set(deletedKeys)

  const idsToDelete = [
    ...withoutKey.map((j) => j.id),
    ...withKey.filter((j) => deletedKeySet.has(j.r2Key)).map((j) => j.id),
  ]

  let deleted = 0
  if (idsToDelete.length > 0) {
    const result = await prisma.exportJob.deleteMany({
      where: { id: { in: idsToDelete }, organizationId },
    })
    deleted = result.count
  }

  return NextResponse.json({ success: true, deleted })
}
