import { auth } from "@/lib/auth"
import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { listGmailCredentialStatuses } from "@/lib/gmail"
import { maxGmailAccounts, maxIntegrations } from "@/lib/plan-limits"
import { MIN_SETTLEMENT_LAG_DAYS, MAX_SETTLEMENT_LAG_DAYS } from "@/lib/matching"
import { providerCatalog, providerCapabilities } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user

  const [credentials, members, rules, org, integrationCreds] = await Promise.all([
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
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settlementLagDays: true, planTier: true },
    }),
    prisma.integrationCredential.findMany({
      where: { organizationId },
      select: {
        id: true,
        provider: true,
        label: true,
        connected: true,
        direction: true,
        lastPulledAt: true,
      },
      orderBy: { createdAt: "asc" },
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
    settlementLagDays: org?.settlementLagDays ?? 30,
    maxGmailAccounts: org ? maxGmailAccounts(org.planTier) : 0,
    // Accounting integrations: the connectable-provider catalog plus this org's
    // connected accounts (with each connector's real Pull/Push capabilities).
    integrations: {
      catalog: providerCatalog(),
      connected: integrationCreds.map((c) => ({
        id: c.id,
        provider: c.provider,
        label: c.label,
        connected: c.connected,
        direction: c.direction,
        lastPulledAt: c.lastPulledAt,
        capabilities: providerCapabilities(c.provider),
      })),
      maxIntegrations: org ? maxIntegrations(org.planTier) : 0,
    },
  })
}

// PATCH /api/settings — update org-level reconcile settings (privileged only).
export async function PATCH(request: Request) {
  const { session, response } = await requirePrivileged()
  if (response) return response

  const body = (await request.json().catch(() => ({}))) as { settlementLagDays?: unknown }
  const value = body.settlementLagDays

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < MIN_SETTLEMENT_LAG_DAYS ||
    value > MAX_SETTLEMENT_LAG_DAYS
  ) {
    return NextResponse.json(
      { error: `settlementLagDays must be an integer between ${MIN_SETTLEMENT_LAG_DAYS} and ${MAX_SETTLEMENT_LAG_DAYS}` },
      { status: 400 }
    )
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { settlementLagDays: value },
  })

  return NextResponse.json({ settlementLagDays: value })
}
