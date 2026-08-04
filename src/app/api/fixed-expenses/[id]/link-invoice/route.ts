import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

// Manually attach an existing invoice to a fixed expense — fixes a real invoice
// that didn't auto-link at ingest (e.g. vendor-name variance) so a period stops
// reading as "Missing". Org-scoped on both sides.
const bodySchema = z.object({ invoiceId: z.string().min(1).max(200) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const expense = await prisma.fixedExpense.findFirst({
    where: { id, organizationId },
    select: { id: true },
  })
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const result = await prisma.invoice.updateMany({
    where: { id: parsed.data.invoiceId, organizationId },
    data: { fixedExpenseId: id },
  })
  if (result.count === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
