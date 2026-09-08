// npx tsx scripts/reextract-bodyonly.ts  (requires the worker running)
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { extractionQueue, type ExtractionJobData } from "@/lib/queues"
import { isPdfAttachment } from "@/lib/gmail-attachments"
import { parseLineItems } from "@/lib/html-invoice-pdf"
import type { AttachmentMeta } from "@/workers/invoice-extract"

async function main() {
  const rows = await prisma.invoice.findMany({
    where: { removedAt: null, gmailCredentialId: { not: null } },
    select: {
      organizationId: true,
      gmailCredentialId: true,
      gmailMessageId: true,
      subject: true,
      lineItems: true,
      attachmentMeta: true,
    },
  })

  let queued = 0
  for (const r of rows) {
    if (!r.gmailCredentialId) continue
    if (parseLineItems(r.lineItems).length > 0) continue
    if (!r.gmailMessageId) continue // Gmail-only re-extraction path
    const attachments = (r.attachmentMeta as AttachmentMeta[]) ?? []
    if (attachments.some(isPdfAttachment)) continue

    await extractionQueue().add(
      "invoice:extract",
      {
        organizationId: r.organizationId,
        gmailCredentialId: r.gmailCredentialId,
        gmailMessageId: r.gmailMessageId,
      } satisfies ExtractionJobData,
      { jobId: `extract-${r.gmailCredentialId}-${r.gmailMessageId}-r${Date.now()}` }
    )
    console.log(`queued: ${r.subject.slice(0, 60)}`)
    queued++
  }
  console.log(`\nre-enqueued ${queued} body-only extraction jobs`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await extractionQueue().close()
    await prisma.$disconnect()
    process.exit(process.exitCode ?? 0)
  })
