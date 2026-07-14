import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { z } from "zod"
import type { SavedMapping, ColumnMapping } from "@/api-types/import"

// CSV column mappings persist for reuse across sessions (auto-applied to files
// with the same header signature). Transactions themselves are never stored —
// reconciliation is ephemeral, handled by /api/reconcile/match.
const mappingSchema = z.object({
  mappingLabel: z.string().min(1),
  headersKey: z.string().min(1),
  mapping: z.object({
    date: z.string().min(1),
    merchant: z.string().min(1),
    amount: z.string().min(1),
    currency: z.string().nullable().optional(),
  }),
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

  const limited = await enforceRateLimit(`import-mapping:${organizationId}`, 30, 60_000)
  if (limited) return limited

  const parsed = mappingSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: z.treeifyError(parsed.error) }, { status: 400 })
  }
  const { mappingLabel, headersKey, mapping } = parsed.data

  await prisma.csvMapping.upsert({
    where: { organizationId_headersKey: { organizationId, headersKey } },
    create: { organizationId, label: mappingLabel, headersKey, mapping },
    update: { label: mappingLabel, mapping },
  })

  return Response.json({ saved: true })
}
