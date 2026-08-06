import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Detach an invoice from its fixed expense (clear fixedExpenseId). Only touches
// the one invoice — the expense's match signals are left intact, so a matching
// invoice could re-link on the next ingest; this just removes THIS arrival. The
// inverse of link-invoice / absorb-invoice. Org-scoped.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const result = await prisma.invoice.updateMany({
    where: { id, organizationId, fixedExpenseId: { not: null } },
    data: { fixedExpenseId: null },
  })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
