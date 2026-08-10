// Detach invoices that were wrongly auto-linked to a fixed expense under the old
// pure-OR matcher — chiefly invoices from a shared invoicing sender (iCount,
// Stripe, …) whose own vendor differs from the expense's vendor.
//
// Re-runs the CURRENT matchesExpense() (with the vendor-conflict guard) over
// every linked invoice and clears fixedExpenseId where it no longer holds. Now
// that the ingest linker uses the same guard, these stay detached instead of
// re-linking on the next sync. Idempotent and safe to re-run.
//
//   npx tsx scripts/unlink-mismatched-fixed-expenses.ts [--dry-run] [--org=<id>]
//
// Dry-run by default is NOT assumed — pass --dry-run to preview without writes.
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { matchesExpense } from "@/lib/fixed-expenses"

function parseArgs() {
  const args = process.argv.slice(2)
  const str = (flag: string) => {
    const hit = args.find((a) => a.startsWith(`${flag}=`))
    return hit ? hit.split("=")[1] : undefined
  }
  return { dryRun: args.includes("--dry-run"), org: str("--org") }
}

async function main() {
  const { dryRun, org } = parseArgs()

  // Every linked invoice, with the three fields matchesExpense reads off each
  // side (the invoice's own + its expense's arrays).
  const rows = await prisma.invoice.findMany({
    where: { fixedExpenseId: { not: null }, ...(org ? { organizationId: org } : {}) },
    select: {
      id: true,
      vendorName: true,
      vendorNormalized: true,
      senderEmail: true,
      gmailCredentialId: true,
      fixedExpense: {
        select: { id: true, name: true, vendorNormalized: true, senderEmail: true, gmailCredentialId: true },
      },
    },
  })

  console.log(`${rows.length} linked invoice(s) to check${dryRun ? " (dry run)" : ""}\n`)

  const stale: string[] = []
  for (const inv of rows) {
    if (!inv.fixedExpense) continue
    if (matchesExpense(inv, inv.fixedExpense)) continue
    stale.push(inv.id)
    const label = (inv.vendorName ?? inv.senderEmail ?? inv.id).slice(0, 50)
    console.log(`  ✂ ${label}  (${inv.senderEmail ?? "?"})  ⇢ was linked to "${inv.fixedExpense.name}"`)
  }

  if (stale.length > 0 && !dryRun) {
    await prisma.invoice.updateMany({ where: { id: { in: stale } }, data: { fixedExpenseId: null } })
  }

  console.log(
    `\nDone. mismatched=${stale.length}` + (dryRun ? " (dry run — no writes)" : " (unlinked)")
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
