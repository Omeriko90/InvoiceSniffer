// Rewrite every invoice's stored `gmailLink` to the message-precise, account-
// pinned form (`u/<mailbox-email>/#all/<messageId>`). Older links used
// `u/0/#inbox/<threadId>`, which lands on the plain inbox for forwarded invoices
// (they're usually filtered out of the Inbox) and can open the wrong account.
// Idempotent — safe to re-run.
//   npx tsx scripts/backfill-gmail-links.ts
import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { buildGmailMessageLink } from "@/lib/gmail"

async function main() {
  const rows = await prisma.invoice.findMany({
    select: {
      id: true,
      gmailMessageId: true,
      gmailLink: true,
      gmailCredential: { select: { email: true } },
    },
  })

  let updated = 0
  for (const r of rows) {
    if (!r.gmailMessageId) continue // non-Gmail (API-sourced) invoice — no Gmail link
    const next = buildGmailMessageLink(r.gmailCredential?.email ?? "", r.gmailMessageId)
    if (next === r.gmailLink) continue // already current
    await prisma.invoice.update({ where: { id: r.id }, data: { gmailLink: next } })
    updated++
  }
  console.log(`\nupdated ${updated} of ${rows.length} invoice links`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(process.exitCode ?? 0)
  })
