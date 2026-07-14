import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeMerchant } from "@/lib/matching"
import { NextResponse } from "next/server"
import { z } from "zod"
import type { AliasType, InvoiceStatus } from "@prisma/client"

// Corrections in an ephemeral session. Transactions are never stored, so these
// endpoints persist ONLY the durable signals: the invoice's reconciled state +
// provenance, and learned vendor aliases (confirm/link → POSITIVE, reject →
// NEGATIVE, no_invoice → IGNORE). Undo reverses the invoice mutation and retires
// an IGNORE rule; POSITIVE/NEGATIVE learning is left intact (you did decide once).
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm"), merchant: z.string().min(1), invoiceId: z.string().min(1), sourceFile: z.string().optional() }),
  z.object({ action: z.literal("link"), merchant: z.string().min(1), invoiceId: z.string().min(1), sourceFile: z.string().optional() }),
  z.object({ action: z.literal("reject"), merchant: z.string().min(1), invoiceId: z.string().min(1) }),
  z.object({ action: z.literal("no_invoice"), merchant: z.string().min(1) }),
  z.object({
    action: z.literal("undo"),
    merchant: z.string().min(1),
    invoiceId: z.string().optional(),
    previousInvoiceStatus: z.enum(["DETECTED", "REVIEWED", "MATCHED", "UNMATCHED"]).optional(),
  }),
])

async function upsertAlias(
  organizationId: string,
  merchantPattern: string,
  vendorName: string,
  type: AliasType
) {
  const existing = await prisma.vendorAlias.findFirst({
    where: { organizationId, merchantPattern, vendorName, type },
  })
  if (existing) {
    await prisma.vendorAlias.update({
      where: { id: existing.id },
      data: { active: true, useCount: { increment: 1 } },
    })
  } else {
    await prisma.vendorAlias.create({
      data: { organizationId, merchantPattern, vendorName, type, source: "USER" },
    })
  }
}

async function markReconciled(
  organizationId: string,
  invoiceId: string,
  sourceFile: string | undefined,
  now: Date
): Promise<string | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    select: { id: true, vendorName: true },
  })
  if (!invoice) return null
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "MATCHED", reconciledSourceFile: sourceFile ?? null, reconciledAt: now },
  })
  return invoice.vendorName
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const parsed = actionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
  const body = parsed.data
  const merchantPattern = normalizeMerchant(body.merchant)

  switch (body.action) {
    case "confirm":
    case "link": {
      const vendorName = await markReconciled(organizationId, body.invoiceId, body.sourceFile, new Date())
      if (vendorName === null) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      if (vendorName) await upsertAlias(organizationId, merchantPattern, vendorName, "POSITIVE")
      break
    }

    case "reject": {
      const invoice = await prisma.invoice.findFirst({
        where: { id: body.invoiceId, organizationId },
        select: { vendorName: true },
      })
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      if (invoice.vendorName) await upsertAlias(organizationId, merchantPattern, invoice.vendorName, "NEGATIVE")
      break
    }

    case "no_invoice": {
      await upsertAlias(organizationId, merchantPattern, body.merchant, "IGNORE")
      break
    }

    case "undo": {
      // Reverse a confirm/link: restore the invoice to its pre-match status and
      // drop the provenance stamp.
      if (body.invoiceId) {
        await prisma.invoice.updateMany({
          where: { id: body.invoiceId, organizationId },
          data: {
            status: (body.previousInvoiceStatus as InvoiceStatus | undefined) ?? "DETECTED",
            reconciledSourceFile: null,
            reconciledAt: null,
          },
        })
      }
      // Reverse a no_invoice: retire the IGNORE rule it created.
      await prisma.vendorAlias.updateMany({
        where: { organizationId, merchantPattern, type: "IGNORE" },
        data: { active: false },
      })
      break
    }
  }

  return NextResponse.json({ success: true })
}
