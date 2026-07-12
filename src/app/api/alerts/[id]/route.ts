import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Dismiss = acknowledge. Org-scoped so users can't touch another org's alerts.
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const result = await prisma.anomalyLog.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { acknowledged: true },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
