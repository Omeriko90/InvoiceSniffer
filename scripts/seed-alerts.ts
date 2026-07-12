// Seed the 4 demo spend alerts from the design mock so the Alerts page has data.
// Usage: npx tsx --env-file=.env scripts/seed-alerts.ts [orgId]
import { prisma } from "../src/lib/prisma"
import type { AnomalyType, AnomalySeverity } from "@prisma/client"
import type { AnomalyDetails } from "../src/types/alert"

type Seed = {
  vendorName: string
  type: AnomalyType
  severity: AnomalySeverity
  details: AnomalyDetails
}

const ALERTS: Seed[] = [
  {
    vendorName: "Amazon Web Services",
    type: "AMOUNT_HIGH",
    severity: "HIGH",
    details: { actual: 612.4, expected: 148, pct: 312, rangeLow: 120, rangeHigh: 190, currency: "USD" },
  },
  {
    vendorName: "Figma Inc.",
    type: "SPEND_SPIKE",
    severity: "MEDIUM",
    details: { actual: 288, expected: 144, multiple: 2, currency: "USD", note: "Two seats appear to have been added." },
  },
  {
    vendorName: "Notion Labs",
    type: "MISSING_RECURRING",
    severity: "MEDIUM",
    details: { expected: 80, overdueDays: 9, expectedDate: "2026-05-06", currency: "USD" },
  },
  {
    vendorName: "Linear",
    type: "NEW_VENDOR",
    severity: "LOW",
    details: { actual: 96, firstSeenDate: "2026-05-09", currency: "USD" },
  },
]

async function main() {
  const orgId = process.argv[2] ?? (await prisma.organization.findFirstOrThrow()).id

  // Clear prior seeded demo alerts for this org so re-runs stay idempotent.
  await prisma.anomalyLog.deleteMany({
    where: { organizationId: orgId, vendorName: { in: ALERTS.map((a) => a.vendorName) } },
  })

  await prisma.anomalyLog.createMany({
    data: ALERTS.map((a) => ({
      organizationId: orgId,
      vendorName: a.vendorName,
      type: a.type,
      severity: a.severity,
      details: a.details as object,
    })),
  })

  const count = await prisma.anomalyLog.count({ where: { organizationId: orgId, acknowledged: false } })
  console.log(`Seeded ${ALERTS.length} alerts for org ${orgId}. Unacknowledged total: ${count}`)
}

main().then(() => process.exit(0))
