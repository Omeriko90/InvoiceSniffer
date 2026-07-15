import { PDFDocument } from "pdf-lib"
import { prisma } from "@/lib/prisma"
import { getGmailClient, GmailNotConnectedError } from "@/lib/gmail"
import { fetchAttachmentBytes, isPdfAttachment } from "@/lib/gmail-attachments"
import { loadInvoicesForExport } from "@/lib/export-data"
import { putExportObject, getSignedExportUrl, exportObjectKey } from "@/lib/r2"
import { log } from "@/lib/posthog-server"
import { format as formatDate } from "date-fns"

// DB-driven PDF export runner. No BullMQ: a QUEUED ExportJob row *is* the work
// item. Invoked one-shot by the Cloud Run Job (MODE=export) in prod, or inline in
// dev. Claims pending PDF jobs, merges each invoice's PDF attachment (fetched
// from Gmail) into one document, uploads to R2, and marks the row READY.

type SkippedEntry = { invoiceId: string; vendorName: string | null; reason: string }

const EXPORT_URL_TTL_SECONDS = 60 * 60 // 1h — the record's downloadUrl is a convenience cache

// Process all currently-pending PDF export jobs, then return. Safe to call
// concurrently: the claim step transitions QUEUED→BUILDING atomically so two
// runners can't grab the same row.
export async function processPendingExports(): Promise<number> {
  const claimedAt = new Date()

  // Claim by flipping QUEUED→BUILDING, then read back the rows we just claimed.
  // startedAt is stamped at claim time so a crashed run's rows are identifiable.
  await prisma.exportJob.updateMany({
    where: { status: "QUEUED", format: "PDF" },
    data: { status: "BUILDING", startedAt: claimedAt },
  })

  const jobs = await prisma.exportJob.findMany({
    where: { status: "BUILDING", format: "PDF", startedAt: claimedAt },
    select: { id: true, organizationId: true, invoiceIds: true, dateRangeStart: true, dateRangeEnd: true },
  })

  for (const job of jobs) {
    try {
      await buildOne(job)
    } catch (error) {
      log.error("PDF export job failed", {
        exportJobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      })
      await prisma.exportJob
        .update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date() } })
        .catch(() => {})
    }
  }

  return jobs.length
}

async function buildOne(job: {
  id: string
  organizationId: string
  invoiceIds: string[]
  dateRangeStart: Date
  dateRangeEnd: Date
}): Promise<void> {
  const invoices = await loadInvoicesForExport(job.organizationId, job.invoiceIds)

  const merged = await PDFDocument.create()
  const skipped: SkippedEntry[] = []
  // Cache Gmail clients per mailbox so a multi-invoice export doesn't re-auth per row.
  const clientCache = new Map<string, Awaited<ReturnType<typeof getGmailClient>>>()

  for (const inv of invoices) {
    const pdfMeta = inv.attachmentMeta.find(isPdfAttachment)
    if (!pdfMeta || !inv.gmailCredentialId) {
      skipped.push({ invoiceId: inv.id, vendorName: inv.vendorName, reason: "no_pdf_attachment" })
      continue
    }

    try {
      let gmail = clientCache.get(inv.gmailCredentialId)
      if (!gmail) {
        gmail = await getGmailClient(inv.gmailCredentialId)
        clientCache.set(inv.gmailCredentialId, gmail)
      }
      const bytes = await fetchAttachmentBytes(gmail, inv.gmailMessageId, pdfMeta)
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const pages = await merged.copyPages(src, src.getPageIndices())
      for (const page of pages) merged.addPage(page)
    } catch (error) {
      const reason =
        error instanceof GmailNotConnectedError ? "gmail_not_connected" : "fetch_or_parse_failed"
      skipped.push({ invoiceId: inv.id, vendorName: inv.vendorName, reason })
    }
  }

  const now = new Date()

  // Every invoice was skipped → nothing to merge. Mark READY with 0 pages would
  // be a confusing empty file; fail instead so the UI reports it clearly.
  if (merged.getPageCount() === 0) {
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        skippedCount: skipped.length,
        skipped: skipped as unknown as object,
        finishedAt: now,
      },
    })
    return
  }

  const out = await merged.save()
  const fileName = `invoices-${formatDate(job.dateRangeStart, "yyyy-MM-dd")}_${formatDate(job.dateRangeEnd, "yyyy-MM-dd")}.pdf`
  const key = exportObjectKey(job.organizationId, job.id, "pdf")
  await putExportObject(key, out, "application/pdf")

  const downloadUrl = await getSignedExportUrl(key, fileName, EXPORT_URL_TTL_SECONDS)
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.exportJob.update({
    where: { id: job.id },
    data: {
      status: "READY",
      r2Key: key,
      downloadUrl,
      fileName,
      mimeType: "application/pdf",
      skippedCount: skipped.length,
      skipped: skipped as unknown as object,
      finishedAt: now,
      expiresAt,
    },
  })
}
