import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { muteSender } from "@/lib/sender-ignore"

// Soft-delete an invoice: hide it from every list by setting removedAt +
// removalReason. The invoice's status is never changed. NOT_AN_INVOICE is a
// human-labeled false positive and always mutes the sender; NOT_RELEVANT is a
// real invoice the user just doesn't want, and only mutes the sender when the
// user opts in (muteSender).
const bodySchema = z
  .object({
    reason: z.enum(["NOT_RELEVANT", "NOT_AN_INVOICE"]),
    muteSender: z.boolean().optional(),
  })
  .strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const organizationId = session.user.organizationId

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const { reason, muteSender: optInMute } = parsed.data

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
    select: { id: true, senderEmail: true, senderName: true, vendorName: true },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const shouldMute =
    reason === "NOT_AN_INVOICE" || (reason === "NOT_RELEVANT" && optInMute === true)

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { removedAt: new Date(), removalReason: reason },
    })
    if (shouldMute) {
      await muteSender(
        tx,
        organizationId,
        invoice.senderEmail,
        invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail.toLowerCase()
      )
    }
  })

  return NextResponse.json({ success: true })
}
