import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSignedExportUrl, exportObjectExists } from "@/lib/r2"
import { NextResponse } from "next/server"

// GET /api/exports/[id]/download — redirect to a freshly signed R2 URL. Re-download
// works for as long as the object lives; if it's gone (lifecycle-expired) the row
// is marked EXPIRED and we return 410.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const job = await prisma.exportJob.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, status: true, r2Key: true, fileName: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (job.status !== "READY" || !job.r2Key) {
    return NextResponse.json({ error: "Export is not ready" }, { status: 409 })
  }

  if (!(await exportObjectExists(job.r2Key))) {
    await prisma.exportJob.update({ where: { id: job.id }, data: { status: "EXPIRED" } }).catch(() => {})
    return NextResponse.json({ error: "Export file has expired" }, { status: 410 })
  }

  const url = await getSignedExportUrl(job.r2Key, job.fileName ?? "export")
  return NextResponse.redirect(url)
}
