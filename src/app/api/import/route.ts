import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { runMatching } from "@/lib/run-matching"
import { z } from "zod"
import type { SavedMapping, ColumnMapping } from "@/api-types/import"

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

  // Each import writes up to 10k rows and runs a full matching pass; cap to
  // 10/min per org to prevent DB/CPU exhaustion from repeated bulk imports.
  const limited = await enforceRateLimit(`import:${organizationId}`, 10, 60_000)
  if (limited) return limited

  const parsed = importSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: z.treeifyError(parsed.error) }, { status: 400 })
  }
  const { fileName, mappingLabel, headersKey, mapping, rows } = parsed.data

  const [created] = await prisma.$transaction([
    prisma.transaction.createMany({
      data: rows.map((row) => ({
        organizationId,
        date: new Date(row.date),
        merchant: row.merchant,
        amount: row.amount,
        currency: row.currency ?? "USD",
        sourceFile: fileName,
      })),
    }),
    prisma.csvMapping.upsert({
      where: { organizationId_headersKey: { organizationId, headersKey } },
      create: { organizationId, label: mappingLabel, headersKey, mapping },
      update: { label: mappingLabel, mapping },
    }),
  ])

  await runMatching(organizationId)

  return Response.json({ imported: created.count })
}
