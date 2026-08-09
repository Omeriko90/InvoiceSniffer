// Backfill expense categories for invoices still sitting at UNCATEGORIZED.
//
// The categorizer only runs at ingest (create-only, so it never clobbers a
// manual category), which leaves every invoice created before it was enabled —
// or while LLM_MODEL was unset — stuck at UNCATEGORIZED. This re-runs the same
// text-only categorizer (vendor + subject + line items) over those rows and
// writes back any decisive category. Idempotent and safe to re-run: it only
// looks at UNCATEGORIZED rows and only writes a different value.
//
//   npx tsx scripts/backfill-categories.ts [--dry-run] [--limit=N] [--org=<id>]
//
// Requires LLM_MODEL to be set (same model every other LLM feature uses).
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { categorizeInvoice, categorizerEnabled } from "@/lib/llm-categorizer"

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

  if (!categorizerEnabled()) {
    console.error("LLM_MODEL is unset — set it (e.g. gemini-2.5-flash) to run the categorizer.")
    process.exitCode = 1
    return
  }

  const rows = await prisma.invoice.findMany({
    where: { category: "UNCATEGORIZED", ...(org ? { organizationId: org } : {}) },
    select: { id: true, vendorName: true, subject: true, senderEmail: true, lineItems: true },
    ...(limit ? { take: limit } : {}),
  })

  console.log(`${rows.length} UNCATEGORIZED invoice(s) to process${dryRun ? " (dry run)" : ""}\n`)

  let categorized = 0
  let stillUncategorized = 0
  let failed = 0

  async function processOne(inv: (typeof rows)[number]) {
    const label = (inv.vendorName ?? inv.subject ?? inv.id).slice(0, 50)
    try {
      const category = await categorizeInvoice({
        vendorName: inv.vendorName,
        subject: inv.subject,
        senderEmail: inv.senderEmail,
        lineItems: Array.isArray(inv.lineItems) ? inv.lineItems : [],
      })
      // categorizeInvoice fails open to null, and returns UNCATEGORIZED when it
      // genuinely can't decide — neither is worth a write.
      if (!category || category === "UNCATEGORIZED") {
        stillUncategorized++
        console.log(`  · ${label} → (left UNCATEGORIZED)`)
        return
      }
      if (!dryRun) {
        await prisma.invoice.update({ where: { id: inv.id }, data: { category } })
      }
      categorized++
      console.log(`  ✓ ${label} → ${category}`)
    } catch (err) {
      failed++
      console.log(`  ✗ ${label} → error: ${String(err)}`)
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(rows.slice(i, i + CONCURRENCY).map(processOne))
  }

  console.log(
    `\nDone. categorized=${categorized} left-uncategorized=${stillUncategorized} failed=${failed}` +
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
