import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { INVOICE_CATEGORIES } from "@/lib/invoice-categories"
import { FIXED_EXPENSE_FREQUENCIES } from "@/lib/fixed-expense-meta"
import { normalizeVendor } from "@/lib/invoice-detection"

const MAX_TEXT = 200
const MAX_AMOUNT = 1e12

// Create-body schema. `.strict()` blocks mass-assignment; every string is
// bounded. At least one match signal (vendor or sender) is required — an expense
// with neither could never link to an invoice. `linkInvoiceId` is the drawer
// flow: create the definition and attach the source invoice atomically.
const createSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_TEXT),
    category: z.enum(INVOICE_CATEGORIES).default("UNCATEGORIZED"),
    // Arrays: an expense can match several vendor titles / sender emails.
    vendorName: z.array(z.string().trim().min(1).max(MAX_TEXT)).default([]),
    senderEmail: z.array(z.string().trim().toLowerCase().email().max(MAX_TEXT)).default([]),
    gmailCredentialId: z.string().max(MAX_TEXT).nullish(),
    expectedAmount: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/, "Invalid amount")
      .refine((s) => Number(s) < MAX_AMOUNT, "Amount too large")
      .nullish(),
    currency: z.string().trim().min(1).max(8).default("USD"),
    frequency: z.enum(FIXED_EXPENSE_FREQUENCIES),
    anchorDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    gracePeriodDays: z.number().int().min(0).max(60).default(5),
    linkInvoiceId: z.string().max(MAX_TEXT).optional(),
  })
  .strict()
  .refine((v) => v.vendorName.length > 0 || v.senderEmail.length > 0, {
    message: "Provide a vendor name or a sender email to match invoices",
    path: ["vendorName"],
  })

// Lightweight list of the org's fixed expenses — powers the invoice-drawer
// "link to an existing expense" dropdown. Decimal/Date serialized to strings.
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const rows = await prisma.fixedExpense.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      vendorName: true,
      senderEmail: true,
      gmailCredentialId: true,
      expectedAmount: true,
      currency: true,
      frequency: true,
      anchorDate: true,
      gracePeriodDays: true,
      status: true,
    },
  })

  return NextResponse.json({
    expenses: rows.map((e) => ({
      ...e,
      expectedAmount: e.expectedAmount?.toString() ?? null,
      anchorDate: e.anchorDate.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.treeifyError(parsed.error) },
      { status: 400 },
    )
  }
  const p = parsed.data
  // Dedup and derive normalized vendor keys from the vendor-title array.
  const vendorNames = [...new Set(p.vendorName)]
  const senderEmails = [...new Set(p.senderEmail)]
  const vendorNormalized = [...new Set(vendorNames.map(normalizeVendor))]

  // Pinned mailbox must belong to this org (no cross-tenant reference).
  if (p.gmailCredentialId) {
    const cred = await prisma.gmailCredential.findFirst({
      where: { id: p.gmailCredentialId, organizationId },
      select: { id: true },
    })
    if (!cred) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 })
  }

  const created = await prisma.$transaction(async (tx) => {
    const expense = await tx.fixedExpense.create({
      data: {
        organizationId,
        name: p.name,
        category: p.category,
        vendorName: vendorNames,
        vendorNormalized,
        senderEmail: senderEmails,
        gmailCredentialId: p.gmailCredentialId || null,
        expectedAmount: p.expectedAmount ?? null,
        currency: p.currency,
        frequency: p.frequency,
        anchorDate: new Date(p.anchorDate),
        gracePeriodDays: p.gracePeriodDays,
        createdById: session.user.id ?? null,
      },
      select: { id: true },
    })

    // Backfill: link existing unlinked invoices that already match, from the
    // anchor date onward. Without this, an expense created after its invoices
    // arrived would show every past period as "Missing" and could fire a false
    // alert for the current period. Matching mirrors matchesExpense() — vendor OR
    // sender, narrowed to the pinned mailbox — expressed as a single updateMany.
    const matchOr: Prisma.InvoiceWhereInput[] = []
    if (vendorNormalized.length > 0) matchOr.push({ vendorNormalized: { in: vendorNormalized } })
    // Sender match stays case-insensitive (one condition per address; `in` can't
    // carry a mode). Invoice sender casing isn't guaranteed to match the stored
    // lowercased signal.
    for (const email of senderEmails) matchOr.push({ senderEmail: { equals: email, mode: "insensitive" } })
    if (matchOr.length > 0) {
      await tx.invoice.updateMany({
        where: {
          organizationId,
          fixedExpenseId: null,
          removedAt: null,
          emailDate: { gte: new Date(p.anchorDate) },
          ...(p.gmailCredentialId ? { gmailCredentialId: p.gmailCredentialId } : {}),
          OR: matchOr,
        },
        data: { fixedExpenseId: expense.id },
      })
    }

    // Drawer flow: attach the source invoice too (it may predate the anchor or
    // otherwise fall outside the backfill window).
    if (p.linkInvoiceId) {
      await tx.invoice.updateMany({
        where: { id: p.linkInvoiceId, organizationId, fixedExpenseId: null },
        data: { fixedExpenseId: expense.id },
      })
    }
    return expense
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
