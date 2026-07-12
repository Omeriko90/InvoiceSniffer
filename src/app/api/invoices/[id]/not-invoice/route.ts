import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Mark an invoice as "not an invoice": hide it (status IGNORED) and record an
// IGNORE rule for the sender so future syncs skip similar emails.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const organizationId = session.user.organizationId

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
    select: { id: true, senderEmail: true, senderName: true, vendorName: true },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const senderEmail = invoice.senderEmail.toLowerCase()

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "IGNORED" },
    })

    // One IGNORE rule per sender — reactivate if the user deleted it before
    const existing = await tx.vendorAlias.findFirst({
      where: { organizationId, senderEmail, type: "IGNORE" },
      select: { id: true },
    })
    if (existing) {
      await tx.vendorAlias.update({
        where: { id: existing.id },
        data: { active: true },
      })
    } else {
      await tx.vendorAlias.create({
        data: {
          organizationId,
          merchantPattern: senderEmail,
          vendorName: invoice.vendorName ?? invoice.senderName ?? senderEmail,
          senderEmail,
          type: "IGNORE",
          source: "USER",
        },
      })
    }
  })

  return NextResponse.json({ success: true })
}
