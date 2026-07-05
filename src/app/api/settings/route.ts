import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user

  const [organization, credential, members, rules] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, gmailConnected: true, lastSyncedAt: true },
    }),
    prisma.gmailCredential.findUnique({
      where: { organizationId },
      select: { email: true },
    }),
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
    gmail: {
      connected: organization?.gmailConnected ?? false,
      email: credential?.email ?? null,
      lastSyncedAt: organization?.lastSyncedAt ?? null,
    },
    members,
    rules,
  })
}
