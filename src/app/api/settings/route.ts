import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { listGmailCredentialStatuses } from "@/lib/gmail"

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user

  const [credentials, members, rules] = await Promise.all([
    listGmailCredentialStatuses(organizationId),
    prisma.user.findMany({
      where: { organizationId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.vendorAlias.findMany({
      where: { organizationId, active: true },
      select: { id: true, merchantPattern: true, vendorName: true, type: true },
      orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    }),
  ])

  return Response.json({
    gmails: credentials.map((c) => ({
      id: c.id,
      connected: c.connected,
      email: c.email,
      label: c.label,
      lastSyncedAt: c.lastSyncedAt,
    })),
    members,
    rules,
  })
}
