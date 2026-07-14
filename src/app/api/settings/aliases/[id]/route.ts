import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePrivileged()
  if (response) return response

  const { id } = await params

  // Scope by organizationId so users can't remove another org's aliases
  const result = await prisma.vendorAlias.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { active: false },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
