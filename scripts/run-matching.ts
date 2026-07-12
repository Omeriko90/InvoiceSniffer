// Run reconciliation matching for an org from the CLI.
// Usage: npx tsx --env-file=.env scripts/run-matching.ts [orgId]
import { prisma } from "../src/lib/prisma"
import { runMatching } from "../src/lib/run-matching"

async function main() {
  const orgId = process.argv[2] ?? (await prisma.organization.findFirstOrThrow()).id
  const result = await runMatching(orgId)
  const byStatus = await prisma.transaction.groupBy({ by: ["status"], _count: true, where: { organizationId: orgId } })
  console.log(result, byStatus)
  const sample = await prisma.transaction.findMany({
    where: { organizationId: orgId, status: { in: ["MATCHED", "POSSIBLE"] } },
    include: { matchedInvoice: { select: { vendorName: true, invoiceNumber: true } } },
    take: 10,
  })
  for (const t of sample) {
    console.log(`${t.date.toISOString().slice(0, 10)} ${t.merchant} $${t.amount} -> ${t.matchedInvoice?.vendorName} (${t.status}, ${t.matchConfidence?.toFixed(2)}) [${t.matchReason}]`)
  }
}
main().then(() => process.exit(0))
