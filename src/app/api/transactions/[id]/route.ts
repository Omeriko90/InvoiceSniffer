import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runMatching } from "@/lib/run-matching"
import {
  normalizeMerchant,
  MANUAL_LINK_REASON,
  REJECTED_REASON,
  USER_NO_INVOICE_REASON,
} from "@/lib/matching"
import { NextResponse } from "next/server"
import { z } from "zod"
import type { AliasType } from "@prisma/client"

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("no_invoice") }),
  z.object({ action: z.literal("undo") }),
  z.object({ action: z.literal("link"), invoiceId: z.string().min(1) }),
])

// Corrections double as learning signals: confirm/link → POSITIVE alias,
// reject → NEGATIVE, no-invoice → IGNORE. These bias the next match run.
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

// Free the invoice back to DETECTED unless another confirmed txn still holds it
async function releaseInvoice(organizationId: string, invoiceId: string, exceptTxnId: string) {
  await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      organizationId,
      status: "MATCHED",
      transactions: { none: { matchConfirmed: true, id: { not: exceptTxnId } } },
    },
    data: { status: "DETECTED" },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const { id } = await params
  const parsed = actionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
  const body = parsed.data

  const txn = await prisma.transaction.findFirst({
    where: { id, organizationId },
    include: { matchedInvoice: { select: { id: true, vendorName: true } } },
  })
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const merchantPattern = normalizeMerchant(txn.merchant)

  switch (body.action) {
    case "confirm": {
      if (!txn.matchedInvoiceId) {
        return NextResponse.json({ error: "No suggested invoice to confirm" }, { status: 400 })
      }
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id },
          data: { status: "MATCHED", matchConfirmed: true },
        }),
        prisma.invoice.update({
          where: { id: txn.matchedInvoiceId },
          data: { status: "MATCHED" },
        }),
      ])
      if (txn.matchedInvoice?.vendorName) {
        await upsertAlias(organizationId, merchantPattern, txn.matchedInvoice.vendorName, "POSITIVE")
      }
      break
    }

    case "reject": {
      if (!txn.matchedInvoiceId) {
        return NextResponse.json({ error: "No suggested invoice to reject" }, { status: 400 })
      }
      await prisma.transaction.update({
        where: { id },
        data: {
          status: "UNMATCHED",
          matchedInvoiceId: null,
          matchConfidence: null,
          matchReason: REJECTED_REASON,
          matchConfirmed: false,
        },
      })
      await releaseInvoice(organizationId, txn.matchedInvoiceId, id)
      if (txn.matchedInvoice?.vendorName) {
        await upsertAlias(organizationId, merchantPattern, txn.matchedInvoice.vendorName, "NEGATIVE")
      }
      break
    }

    case "no_invoice": {
      await prisma.transaction.update({
        where: { id },
        data: {
          status: "NO_INVOICE",
          matchedInvoiceId: null,
          matchConfidence: null,
          matchReason: USER_NO_INVOICE_REASON,
          matchConfirmed: false,
        },
      })
      if (txn.matchedInvoiceId) await releaseInvoice(organizationId, txn.matchedInvoiceId, id)
      await upsertAlias(organizationId, merchantPattern, txn.merchant, "IGNORE")
      break
    }

    case "undo": {
      await prisma.transaction.update({
        where: { id },
        data: {
          status: "UNMATCHED",
          matchedInvoiceId: null,
          matchConfidence: null,
          matchReason: null,
          matchConfirmed: false,
        },
      })
      if (txn.matchedInvoiceId) await releaseInvoice(organizationId, txn.matchedInvoiceId, id)
      // Undoing a no-invoice mark retires the ignore rule it created
      if (txn.status === "NO_INVOICE") {
        await prisma.vendorAlias.updateMany({
          where: { organizationId, merchantPattern, type: "IGNORE" },
          data: { active: false },
        })
      }
      // Re-run so the freed transaction/invoice get fresh suggestions
      await runMatching(organizationId)
      break
    }

    case "link": {
      const invoice = await prisma.invoice.findFirst({
        where: { id: body.invoiceId, organizationId },
        select: { id: true, vendorName: true },
      })
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id },
          data: {
            status: "MATCHED",
            matchedInvoiceId: invoice.id,
            matchConfidence: 1,
            matchReason: MANUAL_LINK_REASON,
            matchConfirmed: true,
          },
        }),
        prisma.invoice.update({ where: { id: invoice.id }, data: { status: "MATCHED" } }),
      ])
      if (txn.matchedInvoiceId && txn.matchedInvoiceId !== invoice.id) {
        await releaseInvoice(organizationId, txn.matchedInvoiceId, id)
      }
      if (invoice.vendorName) {
        await upsertAlias(organizationId, merchantPattern, invoice.vendorName, "POSITIVE")
      }
      break
    }
  }

  return NextResponse.json({ success: true })
}
