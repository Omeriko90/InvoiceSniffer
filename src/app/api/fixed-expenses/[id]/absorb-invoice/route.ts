import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildFixedExpenseMatchWhere, dedupeInsensitive } from "@/lib/fixed-expenses"

// Absorb a source invoice into an existing fixed expense (the invoice-drawer
// "link to an existing expense" flow). Unlike link-invoice (a pure single link),
// this teaches the expense the invoice's vendor title + sender so ALL matching
// invoices — past (swept here) and future (auto-linked at ingest) — belong to it.
const bodySchema = z.object({ invoiceId: z.string().min(1).max(200) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const [expense, invoice] = await Promise.all([
    prisma.fixedExpense.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        vendorName: true,
        vendorNormalized: true,
        senderEmail: true,
        gmailCredentialId: true,
      },
    }),
    prisma.invoice.findFirst({
      where: { id: parsed.data.invoiceId, organizationId },
      select: { vendorName: true, vendorNormalized: true, senderEmail: true },
    }),
  ])
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  // Merge the invoice's signals into the expense's arrays (sender lowercased to
  // match how create/PATCH store it; vendorNormalized is already normalized).
  const mergedVendorName = dedupeInsensitive([...expense.vendorName, invoice.vendorName ?? ""])
  const mergedNormalized = dedupeInsensitive([...expense.vendorNormalized, invoice.vendorNormalized ?? ""])
  const mergedSenders = dedupeInsensitive([...expense.senderEmail, invoice.senderEmail?.toLowerCase() ?? ""])

  await prisma.$transaction(async (tx) => {
    await tx.fixedExpense.update({
      where: { id: expense.id },
      data: {
        vendorName: mergedVendorName,
        vendorNormalized: mergedNormalized,
        senderEmail: mergedSenders,
      },
    })

    // Sweep in every unlinked invoice matching the merged signals — no anchorDate
    // floor, so all PAST invoices "from this sender" are captured too. A vendor
    // conflict still blocks a shared-sender-only hit (mirrors matchesExpense).
    const matchWhere = buildFixedExpenseMatchWhere({
      vendorNormalized: mergedNormalized,
      senderEmail: mergedSenders,
    })
    if (!matchWhere) return

    await tx.invoice.updateMany({
      where: {
        organizationId,
        fixedExpenseId: null,
        removedAt: null,
        ...(expense.gmailCredentialId ? { gmailCredentialId: expense.gmailCredentialId } : {}),
        ...matchWhere,
      },
      data: { fixedExpenseId: expense.id },
    })
  })

  return NextResponse.json({ success: true })
}
