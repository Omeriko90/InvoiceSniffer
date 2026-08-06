// One-off backfill: rewrite invoice.currency values that were persisted as a
// symbol/alias ("₪", "NIS", "€", …) into ISO 4217 codes ("ILS", "EUR", …).
// Older LLM extractions stored the currency "as written on the document", and a
// raw symbol crashes Intl.NumberFormat wherever the invoice is rendered.
//   npx tsx scripts/normalize-invoice-currency.ts
import "dotenv/config"
import { normalizeCurrencyCode } from "@/lib/csv-import"
import { prisma } from "@/lib/prisma"

async function main() {
  // Distinct currencies currently stored, so we only touch the ones that change.
  const distinct = await prisma.invoice.findMany({
    select: { currency: true },
    distinct: ["currency"],
  })

  let totalUpdated = 0
  for (const { currency } of distinct) {
    const normalized = normalizeCurrencyCode(currency)
    if (normalized === currency) continue // already an ISO code (or unknown passthrough)

    const { count } = await prisma.invoice.updateMany({
      where: { currency },
      data: { currency: normalized },
    })
    console.log(`"${currency}" → "${normalized}": ${count} invoice(s)`)
    totalUpdated += count
  }

  console.log(`\nnormalized ${totalUpdated} invoice(s)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
