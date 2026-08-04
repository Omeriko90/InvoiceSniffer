import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

  const or = [
    expense.vendorNormalized ? { vendorNormalized: expense.vendorNormalized } : null,
    expense.senderEmail
      ? { senderEmail: { equals: expense.senderEmail, mode: "insensitive" as const } }
      : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null)
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
