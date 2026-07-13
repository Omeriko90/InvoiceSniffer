import { createHash } from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { matchingQueue, type MatchingJobData } from "@/lib/queues"
import { triggerBatchWorker } from "@/lib/worker-trigger"
import { z } from "zod"
import type { SavedMapping, ColumnMapping } from "@/api-types/import"

// Natural-key hash so re-uploading the same statement dedupes (unique on
// [organizationId, dedupeKey]) instead of doubling every transaction. Keyed on
// the transaction's identity fields; trade-off: two genuinely identical charges
// (same date/merchant/amount/currency) collapse to one — rare and ambiguous
// enough to accept in exchange for import idempotency.
function dedupeKey(date: string, merchant: string, amount: number, currency: string): string {
  const norm = `${new Date(date).toISOString().slice(0, 10)}|${merchant.trim().toLowerCase()}|${amount.toFixed(2)}|${currency.toUpperCase()}`
  return createHash("md5").update(norm).digest("hex")
}

const importSchema = z.object({
  fileName: z.string().min(1),
  mappingLabel: z.string().min(1),
  headersKey: z.string().min(1),
  mapping: z.object({
    date: z.string().min(1),
    merchant: z.string().min(1),
    amount: z.string().min(1),
    currency: z.string().nullable().optional(),
  }),
  rows: z
    .array(
      z.object({
        date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid date"),
        merchant: z.string().min(1),
        amount: z.number(),
        currency: z.string().optional(),
      })
    )
    .min(1)
    .max(10_000),
})

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const mappings = await prisma.csvMapping.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: "desc" },
  })

  const result: SavedMapping[] = mappings.map((m) => ({
    id: m.id,
    label: m.label,
    headersKey: m.headersKey,
    mapping: m.mapping as unknown as ColumnMapping,
  }))

  return Response.json(result)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user

  const parsed = importSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: z.treeifyError(parsed.error) }, { status: 400 })
  }
  const { fileName, mappingLabel, headersKey, mapping, rows } = parsed.data

  const [created] = await prisma.$transaction([
    prisma.transaction.createMany({
      data: rows.map((row) => {
        const currency = row.currency ?? "USD"
        return {
          organizationId,
          date: new Date(row.date),
          merchant: row.merchant,
          amount: row.amount,
          currency,
          sourceFile: fileName,
          dedupeKey: dedupeKey(row.date, row.merchant, row.amount, currency),
        }
      }),
      skipDuplicates: true, // re-imported statements dedupe on [organizationId, dedupeKey]
    }),
    prisma.csvMapping.upsert({
      where: { organizationId_headersKey: { organizationId, headersKey } },
      create: { organizationId, label: mappingLabel, headersKey, mapping },
      update: { label: mappingLabel, mapping },
    }),
  ])

  // Matching runs as a queued job rather than in-request: on a large first
  // import (thousands of txns × hundreds of invoices) the O(n·m) scan could
  // exceed the request/function timeout. Enqueue + trigger the drain; the
  // Reconcile view reads fresh results once it completes.
  await matchingQueue.add(
    "match:run",
    { organizationId } satisfies MatchingJobData,
    { jobId: `match-${organizationId}` }, // dedupe overlapping runs per org
  )
  await triggerBatchWorker()

  return Response.json({ imported: created.count })
}
