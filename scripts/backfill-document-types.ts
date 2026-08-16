// Backfill the document type (Invoice / Receipt / Credit Note) for invoices
// still sitting at UNKNOWN.
//
// documentType is set at ingest only by the Tier-2 vision extractor, which runs
// on a subset of invoices (PDF present + borderline heuristics) — so everything
// ingested before the field was surfaced, or that never hit vision, is stuck at
// UNKNOWN. This runs a cheap TEXT-ONLY classifier (vendor + subject + line
// items, no PDF / no Gmail round-trip) over those rows and writes back any
// decisive type. Idempotent and safe to re-run: it only looks at UNKNOWN rows,
// only writes a different value, and touches nothing but documentType (so it
// never clobbers manual edits to other fields).
//
//   npx tsx scripts/backfill-document-types.ts [--dry-run] [--limit=N] [--org=<id>]
//
// Requires LLM_MODEL to be set (same model every other LLM feature uses).
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { classifyDocumentType, doctypeClassifierEnabled } from "@/lib/llm-doctype-classifier"
import { DOCUMENT_TYPE_LABELS } from "@/lib/document-types"

const CONCURRENCY = 5

function parseArgs() {
  const args = process.argv.slice(2)
  const num = (flag: string) => {
    const hit = args.find((a) => a.startsWith(`${flag}=`))
    return hit ? Number(hit.split("=")[1]) : undefined
  }
  const str = (flag: string) => {
    const hit = args.find((a) => a.startsWith(`${flag}=`))
    return hit ? hit.split("=")[1] : undefined
  }
  return { dryRun: args.includes("--dry-run"), limit: num("--limit"), org: str("--org") }
}

async function main() {
  const { dryRun, limit, org } = parseArgs()

  if (!doctypeClassifierEnabled()) {
    console.error("LLM_MODEL is unset — set it (e.g. gemini-2.5-flash) to run the classifier.")
    process.exitCode = 1
    return
  }

  const rows = await prisma.invoice.findMany({
    where: { documentType: "UNKNOWN", ...(org ? { organizationId: org } : {}) },
    select: { id: true, vendorName: true, subject: true, senderEmail: true, lineItems: true },
    ...(limit ? { take: limit } : {}),
  })

  console.log(`${rows.length} UNKNOWN-type invoice(s) to process${dryRun ? " (dry run)" : ""}\n`)

  let typed = 0
  let stillUnknown = 0
  let failed = 0

  async function processOne(inv: (typeof rows)[number]) {
    const label = (inv.vendorName ?? inv.subject ?? inv.id).slice(0, 50)
    try {
      const documentType = await classifyDocumentType({
        vendorName: inv.vendorName,
        subject: inv.subject,
        senderEmail: inv.senderEmail,
        lineItems: Array.isArray(inv.lineItems) ? inv.lineItems : [],
      })
      // classifyDocumentType fails open to null, and returns UNKNOWN when it
      // genuinely can't decide — neither is worth a write.
      if (!documentType || documentType === "UNKNOWN") {
        stillUnknown++
        console.log(`  · ${label} → (left UNKNOWN)`)
        return
      }
      if (!dryRun) {
        await prisma.invoice.update({ where: { id: inv.id }, data: { documentType } })
      }
      typed++
      console.log(`  ✓ ${label} → ${DOCUMENT_TYPE_LABELS[documentType]}`)
    } catch (err) {
      failed++
      console.log(`  ✗ ${label} → error: ${String(err)}`)
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(rows.slice(i, i + CONCURRENCY).map(processOne))
  }

  console.log(
    `\nDone. typed=${typed} left-unknown=${stillUnknown} failed=${failed}` +
      (dryRun ? " (dry run — no writes)" : "")
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
