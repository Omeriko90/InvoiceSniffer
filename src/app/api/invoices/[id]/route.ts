import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { INVOICE_CATEGORIES } from "@/lib/invoice-categories"
import { INVOICE_ROW_SELECT, toInvoiceRow } from "@/lib/invoice-row"

// Fetch a single invoice as a full InvoiceRow — powers the invoice drawer when
// opened outside the list (e.g. from a fixed-expense period). Org-scoped.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: INVOICE_ROW_SELECT,
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(toInvoiceRow(invoice))
}

const MAX_TEXT = 500
const MAX_AMOUNT = 1e12 // generous per-invoice ceiling; blocks storage/overflow abuse

// Bounded, whitelisted patch schema. Every field is optional so this stays a
// partial update, but each has a length/format cap — untrusted strings here flow
// into exports and matching, so they must not be unbounded. `.strict()` rejects
// unknown keys (no mass-assignment). Amount is a decimal string (no scientific
// notation / negatives / absurd precision) so it lands cleanly in the Decimal
// column. Dates must be parseable ISO strings or null.
const dateField = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
  .nullable()

const patchSchema = z
  .object({
    vendorName: z.string().trim().max(MAX_TEXT).nullable(),
    invoiceNumber: z.string().trim().max(MAX_TEXT).nullable(),
    totalAmount: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/, "Invalid amount")
      .refine((s) => Number(s) < MAX_AMOUNT, "Amount too large"),
    invoiceDate: dateField,
    dueDate: dateField,
    category: z.enum(INVOICE_CATEGORIES),
  })
  .partial()
  .strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.treeifyError(parsed.error) },
      { status: 400 }
    )
  }
  const p = parsed.data

  const data: Prisma.InvoiceUpdateManyMutationInput = {}

  if (p.vendorName !== undefined) {
    const name = p.vendorName || null
    data.vendorName = name
    data.vendorNormalized = name?.toLowerCase() ?? null
  }
  if (p.invoiceNumber !== undefined) {
    data.invoiceNumber = p.invoiceNumber || null
  }
  if (p.totalAmount !== undefined) {
    data.totalAmount = p.totalAmount
  }
  if (p.invoiceDate !== undefined) {
    data.invoiceDate = p.invoiceDate === null ? null : new Date(p.invoiceDate)
  }
  if (p.dueDate !== undefined) {
    data.dueDate = p.dueDate === null ? null : new Date(p.dueDate)
  }
  if (p.category !== undefined) {
    data.category = p.category
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 })
  }

  // Scope by organizationId so users can't edit another org's invoices
  const result = await prisma.invoice.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data,
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
