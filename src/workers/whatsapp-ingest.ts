import { prisma } from "@/lib/prisma"
import { runExtraction } from "@/lib/extract-core"
import { linkInvoiceToMatchingFixedExpense } from "@/lib/link-fixed-expense"
import { getObjectBytes } from "@/lib/r2"
import { sendText } from "@/lib/whatsapp"
import { log } from "@/lib/posthog-server"

// DB-driven drain of inbound WhatsApp media (no BullMQ). The webhook persists
// each media message to R2 and writes a PENDING WhatsAppInboundMessage row; this
// turns those rows into Invoices via the shared extraction core, then replies to
// the sender. Runs as the Cloud Run Job's MODE=whatsapp-ingest, or in-process in
// dev (see triggerWhatsAppIngest).

const BATCH_LIMIT = 100

// Treat an extraction with neither an amount nor a vendor as unreadable — the
// user explicitly sent a document expecting it to be parsed, so a "couldn't
// read that" reply is more useful than a silent empty invoice.
function looksUnreadable(amount: number | null, vendorName: string | null): boolean {
  return !amount && !vendorName
}

export async function processPendingWhatsApp(): Promise<number> {
  const pending = await prisma.whatsAppInboundMessage.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_LIMIT,
    select: {
      id: true,
      organizationId: true,
      whatsappMessageId: true,
      fromPhoneE164: true,
      r2Key: true,
      mimeType: true,
      caption: true,
      createdAt: true,
    },
  })

  let processed = 0
  for (const msg of pending) {
    // Claim the row atomically so concurrent Job runs can't double-process it.
    const claim = await prisma.whatsAppInboundMessage.updateMany({
      where: { id: msg.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    })
    if (claim.count === 0) continue

    try {
      if (!msg.r2Key) throw new Error("inbound row has no r2Key")
      const bytes = await getObjectBytes(msg.r2Key)
      const caption = msg.caption?.trim() || null
      const subject = caption ?? "WhatsApp invoice"

      const { extracted, extractionMethod, category, convertedFields } = await runExtraction({
        organizationId: msg.organizationId,
        senderEmail: null,
        senderName: null,
        subject,
        bodyText: caption ?? "",
        bodyHtml: null,
        docBytes: bytes,
        docMimeType: msg.mimeType,
      })

      if (looksUnreadable(extracted.totalAmount, extracted.vendorName)) {
        await prisma.whatsAppInboundMessage.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: "unreadable", processedAt: new Date() },
        })
        await sendText(
          msg.fromPhoneE164,
          "⚠️ I couldn't read that invoice. Please send a clearer photo or the original PDF."
        )
        processed++
        continue
      }

      const invoice = await prisma.invoice.upsert({
        where: {
          organizationId_whatsappMessageId: {
            organizationId: msg.organizationId,
            whatsappMessageId: msg.whatsappMessageId,
          },
        },
        create: {
          organizationId: msg.organizationId,
          source: "WHATSAPP",
          whatsappMessageId: msg.whatsappMessageId,
          whatsappFromPhone: msg.fromPhoneE164,
          r2Key: msg.r2Key,
          // Channel-neutral title + received timestamp (kept NOT NULL).
          subject,
          emailDate: msg.createdAt,
          vendorName: extracted.vendorName,
          vendorNormalized: extracted.vendorNormalized,
          invoiceNumber: extracted.invoiceNumber,
          allocationNumber: extracted.allocationNumber,
          vendorTaxId: extracted.vendorTaxId,
          documentType: extracted.documentType,
          invoiceDate: extracted.invoiceDate ?? msg.createdAt,
          dueDate: extracted.dueDate,
          totalAmount: extracted.totalAmount ?? 0,
          currency: extracted.currency,
          taxAmount: extracted.taxAmount,
          lineItems: extracted.lineItems as never,
          receiptUrl: null,
          extractionMethod,
          extractionConfidence: extracted.confidence,
          ...convertedFields,
          ...(category ? { category } : {}),
        },
        update: {
          vendorName: extracted.vendorName,
          vendorNormalized: extracted.vendorNormalized,
          invoiceNumber: extracted.invoiceNumber,
          allocationNumber: extracted.allocationNumber,
          vendorTaxId: extracted.vendorTaxId,
          documentType: extracted.documentType,
          invoiceDate: extracted.invoiceDate ?? msg.createdAt,
          dueDate: extracted.dueDate,
          totalAmount: extracted.totalAmount ?? 0,
          currency: extracted.currency,
          taxAmount: extracted.taxAmount,
          lineItems: extracted.lineItems as never,
          extractionMethod,
          extractionConfidence: extracted.confidence,
          ...convertedFields,
        },
      })

      // Arrival tracking, inline and best-effort (mirrors the Gmail worker).
      try {
        await linkInvoiceToMatchingFixedExpense(invoice)
      } catch (err) {
        log.warn("whatsapp-ingest: fixed-expense link failed", {
          whatsappMessageId: msg.whatsappMessageId,
          error: err instanceof Error ? err.message : String(err),
        })
      }

      await prisma.whatsAppInboundMessage.update({
        where: { id: msg.id },
        data: { status: "DONE", invoiceId: invoice.id, processedAt: new Date() },
      })

      const vendor = extracted.vendorName ?? "your invoice"
      const amount =
        extracted.totalAmount != null
          ? ` — ${extracted.totalAmount.toLocaleString()} ${extracted.currency}`
          : ""
      await sendText(msg.fromPhoneE164, `✅ Added: ${vendor}${amount}`)
      processed++
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      log.error("whatsapp-ingest: failed to process message", {
        whatsappMessageId: msg.whatsappMessageId,
        error,
      })
      await prisma.whatsAppInboundMessage.update({
        where: { id: msg.id },
        data: { status: "FAILED", error, processedAt: new Date() },
      })
      await sendText(
        msg.fromPhoneE164,
        "⚠️ Something went wrong processing your invoice. Please try again shortly."
      )
      processed++
    }
  }

  return processed
}
