import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { INVOICE_CATEGORIES } from "@/lib/invoice-categories"
import { FIXED_EXPENSE_FREQUENCIES, FIXED_EXPENSE_STATUSES } from "@/lib/fixed-expense-meta"
import { normalizeVendor } from "@/lib/invoice-detection"

const MAX_TEXT = 200
const MAX_AMOUNT = 1e12

// Partial update. Pausing/resuming is just `{ status }`. `.strict()` blocks
// unknown keys. Every field mirrors the create schema's bounds.
const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_TEXT),
    category: z.enum(INVOICE_CATEGORIES),
    vendorName: z.array(z.string().trim().min(1).max(MAX_TEXT)),
    senderEmail: z.array(z.string().trim().toLowerCase().email().max(MAX_TEXT)),
    gmailCredentialId: z.string().max(MAX_TEXT).nullable(),
    expectedAmount: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/, "Invalid amount")
      .refine((s) => Number(s) < MAX_AMOUNT, "Amount too large")
      .nullable(),
    currency: z.string().trim().min(1).max(8),
    frequency: z.enum(FIXED_EXPENSE_FREQUENCIES),
    anchorDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    gracePeriodDays: z.number().int().min(0).max(60),
    status: z.enum(FIXED_EXPENSE_STATUSES),
  })
  .partial()
  .strict()

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.treeifyError(parsed.error) },
      { status: 400 },
    )
  }
  const p = parsed.data
  const data: Prisma.FixedExpenseUpdateManyMutationInput = {}

  if (p.name !== undefined) data.name = p.name
  if (p.category !== undefined) data.category = p.category
  if (p.vendorName !== undefined) {
    const names = [...new Set(p.vendorName)]
    data.vendorName = names
    data.vendorNormalized = [...new Set(names.map(normalizeVendor))]
  }
  if (p.senderEmail !== undefined) data.senderEmail = [...new Set(p.senderEmail)]
  if (p.gmailCredentialId !== undefined) data.gmailCredentialId = p.gmailCredentialId || null
  if (p.expectedAmount !== undefined) data.expectedAmount = p.expectedAmount
  if (p.currency !== undefined) data.currency = p.currency
  if (p.frequency !== undefined) data.frequency = p.frequency
  if (p.anchorDate !== undefined) data.anchorDate = new Date(p.anchorDate)
  if (p.gracePeriodDays !== undefined) data.gracePeriodDays = p.gracePeriodDays
  if (p.status !== undefined) data.status = p.status

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 })
  }

  // Validate a newly-pinned mailbox belongs to this org.
  if (p.gmailCredentialId) {
    const cred = await prisma.gmailCredential.findFirst({
      where: { id: p.gmailCredentialId, organizationId },
      select: { id: true },
    })
    if (!cred) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 })
  }

  const result = await prisma.fixedExpense.updateMany({
    where: { id, organizationId },
    data,
  })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  // Hard delete; the FK's onDelete: SetNull clears fixedExpenseId on any linked
  // invoices (their arrival history is dropped along with the definition).
  const result = await prisma.fixedExpense.deleteMany({ where: { id, organizationId } })
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
