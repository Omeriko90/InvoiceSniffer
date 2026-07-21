// Debug a single email through the extraction pipeline, printing what each
// stage sees. Usage:
//   npx tsx scripts/debug-extract.ts                 # most recent invoice with amount 0
//   npx tsx scripts/debug-extract.ts <gmailMessageId>
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { extractInvoiceMetadata } from "@/lib/invoice-detection"
import { findReceiptUrl, fetchReceiptText, isAllowlistedHost } from "@/lib/receipt-link"
import {
  extractBodyText,
  extractBodyHtml,
  extractAttachmentMeta,
  fetchAttachmentPdfText,
  fetchAttachmentPdfBytes,
  parseFrom,
  type GmailPart,
} from "@/workers/invoice-extract"
import { extractorEnabled, extractInvoiceFromPdf } from "@/lib/llm-extractor"

function preview(text: string | null, label: string) {
  console.log(`\n── ${label} ${"─".repeat(Math.max(0, 60 - label.length))}`)
  if (!text) {
    console.log("(none)")
    return
  }
  const trimmed = text.replace(/\n{3,}/g, "\n\n").trim()
  console.log(trimmed.slice(0, 800))
  if (trimmed.length > 800) console.log(`… (${trimmed.length} chars total)`)
}

function printExtraction(label: string, e: ReturnType<typeof extractInvoiceMetadata>) {
  console.log(`\n>> extraction from ${label}:`)
  console.log(
    `   amount=${e.totalAmount} currency=${e.currency} tax=${e.taxAmount} ` +
      `invoice#=${e.invoiceNumber} date=${e.invoiceDate?.toISOString().slice(0, 10) ?? null} ` +
      `confidence=${e.confidence}`
  )
}

async function main() {
  let gmailMessageId = process.argv[2]
  let organizationId: string

  if (gmailMessageId) {
    const inv = await prisma.invoice.findFirst({ where: { gmailMessageId } })
    if (!inv) throw new Error(`No invoice found for gmailMessageId ${gmailMessageId}`)
    organizationId = inv.organizationId
  } else {
    const inv = await prisma.invoice.findFirst({
      where: { totalAmount: 0 },
      orderBy: { createdAt: "desc" },
    })
    if (!inv) {
      console.log("No invoices with amount 0 found — nothing to debug.")
      return
    }
    gmailMessageId = inv.gmailMessageId
    organizationId = inv.organizationId
    console.log(`Debugging most recent zero-amount invoice: "${inv.subject}"`)
  }

  const gmail = await getGmailClient(organizationId)
  const msg = await gmail.users.messages.get({ userId: "me", id: gmailMessageId, format: "full" })
  const payload = msg.data.payload as GmailPart
  const headers = (msg.data.payload?.headers ?? []) as { name?: string; value?: string }[]

  const subject = headers.find((h) => h.name === "Subject")?.value ?? ""
  const from = headers.find((h) => h.name === "From")?.value ?? ""
  const { senderEmail, senderName } = parseFrom(from)

  console.log(`\nSubject: ${subject}`)
  console.log(`From:    ${from}`)

  // 1. Email body
  const bodyText = extractBodyText(payload)
  preview(bodyText, "email body text")
  printExtraction("body", extractInvoiceMetadata(senderEmail, senderName, subject, bodyText))

  // 2. PDF attachment
  const attachments = extractAttachmentMeta(payload)
  console.log(`\nAttachments: ${attachments.length === 0 ? "(none)" : ""}`)
  for (const a of attachments) console.log(`   ${a.filename} (${a.mimeType}, ${a.size} bytes)`)

  const pdfText = await fetchAttachmentPdfText(gmail, gmailMessageId, attachments)
  preview(pdfText, "attachment PDF text")
  if (pdfText) {
    printExtraction("attachment PDF", extractInvoiceMetadata(senderEmail, senderName, subject, pdfText))
  }

  // 3. Hosted receipt link
  const bodyHtml = extractBodyHtml(payload)
  const receiptUrl = bodyHtml ? findReceiptUrl(bodyHtml) : null
  console.log(`\nReceipt URL: ${receiptUrl ?? "(none found)"}`)
  if (receiptUrl) {
    console.log(`   allowlisted for fetching: ${isAllowlistedHost(receiptUrl)}`)
    const remoteText = await fetchReceiptText(receiptUrl)
    preview(remoteText, "fetched receipt text")
    if (remoteText) {
      printExtraction("fetched receipt", extractInvoiceMetadata(senderEmail, senderName, subject, remoteText))
    }
  }

  // 4. Tier 2 LLM extraction (only when EXTRACTION_MODEL is set)
  console.log(`\n── Tier 2 LLM extractor ${"─".repeat(40)}`)
  if (!extractorEnabled()) {
    console.log("(disabled — set EXTRACTION_MODEL=claude-haiku-4-5 to test)")
  } else {
    const pdfBytes = await fetchAttachmentPdfBytes(gmail, gmailMessageId, attachments)
    if (!pdfBytes) {
      console.log("(no PDF attachment to send to the LLM)")
    } else {
      console.log(`Sending ${pdfBytes.length} bytes to ${process.env.EXTRACTION_MODEL} …`)
      const llm = await extractInvoiceFromPdf({ pdfBytes, subject, senderEmail })
      console.log(llm ? JSON.stringify(llm, null, 2) : "(extractor returned null / failed — see warnings above)")
    }
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    // a timed-out PDF parse can leave pdfjs handles open — exit explicitly
    process.exit(process.exitCode ?? 0)
  })
