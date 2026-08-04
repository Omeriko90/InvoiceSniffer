import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

// Recent unlinked invoices that plausibly belong to this fixed expense (same
// normalized vendor or sender), offered when the user links a "Missing" period
// by hand. Bounded — a shortlist, not a full invoice browser.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const expense = await prisma.fixedExpense.findFirst({
    where: { id, organizationId },
    select: { vendorNormalized: true, senderEmail: true, gmailCredentialId: true },
  })
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const or: Prisma.InvoiceWhereInput[] = []
  if (expense.vendorNormalized.length > 0) or.push({ vendorNormalized: { in: expense.vendorNormalized } })
  for (const email of expense.senderEmail) or.push({ senderEmail: { equals: email, mode: "insensitive" } })
  if (or.length === 0) return NextResponse.json({ candidates: [] })

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      fixedExpenseId: null,
      removedAt: null,
      ...(expense.gmailCredentialId ? { gmailCredentialId: expense.gmailCredentialId } : {}),
      OR: or,
    },
    orderBy: { emailDate: "desc" },
    take: 20,
    select: { id: true, vendorName: true, totalAmount: true, currency: true, emailDate: true },
  })

  return NextResponse.json({
    candidates: invoices.map((inv) => ({
      id: inv.id,
      vendorName: inv.vendorName,
      totalAmount: inv.totalAmount.toString(),
      currency: inv.currency,
      emailDate: inv.emailDate.toISOString(),
    })),
  })
}
