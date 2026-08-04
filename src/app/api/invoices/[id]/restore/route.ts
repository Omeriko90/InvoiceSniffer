import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Undo a soft-delete (the "Undo" toast action): clear removedAt + removalReason
// so the invoice reappears. Its status was never changed, so there's nothing to
// restore there. If this was the last still-removed invoice from the sender, the
// user's IGNORE rule for that sender is deactivated too — reversing a mute this
// removal created without clobbering a rule earned from other emails.
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
    select: { id: true, senderEmail: true },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { removedAt: null, removalReason: null },
    })

    // No other removed invoice from this sender → nothing left justifying the
    // mute, so deactivate the user's IGNORE rule (Settings can re-add it).
    const otherRemoved = await tx.invoice.count({
      where: {
        organizationId,
        senderEmail: invoice.senderEmail,
        removedAt: { not: null },
        id: { not: invoice.id },
      },
    })
    if (otherRemoved === 0) {
      await tx.vendorAlias.updateMany({
        where: {
          organizationId,
          senderEmail: invoice.senderEmail.toLowerCase(),
          type: "IGNORE",
          source: "USER",
          active: true,
        },
        data: { active: false },
      })
    }
  })

  return NextResponse.json({ success: true })
}
