// Re-enqueue extraction for all invoices that ended up with amount 0, so
// improved extraction logic can take another pass. Requires the worker running.
//   npx tsx scripts/reextract-zero.ts
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { extractionQueue, type ExtractionJobData } from "@/lib/queues"

async function main() {
  const rows = await prisma.invoice.findMany({
    where: { totalAmount: 0 },
    select: { organizationId: true, gmailMessageId: true, subject: true },
  })

  for (const r of rows) {
    await extractionQueue.add(
      "invoice:extract",
      { organizationId: r.organizationId, gmailMessageId: r.gmailMessageId } satisfies ExtractionJobData,
      // unique suffix so BullMQ's completed-job dedup doesn't swallow the retry
      { jobId: `extract-${r.organizationId}-${r.gmailMessageId}-r${Date.now()}` }
    )
    console.log(`queued: ${r.subject.slice(0, 60)}`)
  }
  console.log(`\nre-enqueued ${rows.length} extraction jobs`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await extractionQueue.close()
    await prisma.$disconnect()
  })
