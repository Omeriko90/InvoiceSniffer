import { auth } from "@/lib/auth"
import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { listGmailCredentialStatuses } from "@/lib/gmail"
import { maxGmailAccounts } from "@/lib/plan-limits"
import { MIN_SETTLEMENT_LAG_DAYS, MAX_SETTLEMENT_LAG_DAYS } from "@/lib/matching"
import { isSupportedDisplayCurrency, SUPPORTED_DISPLAY_CURRENCIES } from "@/lib/currency"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { organizationId } = session.user

  const [credentials, members, rules, org] = await Promise.all([
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
      select: { settlementLagDays: true, displayCurrency: true, planTier: true },
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
    displayCurrency: org?.displayCurrency ?? "USD",
    maxGmailAccounts: org ? maxGmailAccounts(org.planTier) : 0,
  })
}

// PATCH /api/settings — update org-level settings (privileged only). Accepts a
// partial body: settlementLagDays and/or displayCurrency.
export async function PATCH(request: Request) {
  const { session, response } = await requirePrivileged()
  if (response) return response

  const body = (await request.json().catch(() => ({}))) as {
    settlementLagDays?: unknown
    displayCurrency?: unknown
  }
  const data: { settlementLagDays?: number; displayCurrency?: string } = {}

  if (body.settlementLagDays !== undefined) {
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
    data.settlementLagDays = value
  }

  if (body.displayCurrency !== undefined) {
    if (!isSupportedDisplayCurrency(body.displayCurrency)) {
      return NextResponse.json(
        { error: `displayCurrency must be one of: ${SUPPORTED_DISPLAY_CURRENCIES.join(", ")}` },
        { status: 400 }
      )
    }
    data.displayCurrency = body.displayCurrency
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid settings to update" }, { status: 400 })
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data,
  })

  return NextResponse.json(data)
}
