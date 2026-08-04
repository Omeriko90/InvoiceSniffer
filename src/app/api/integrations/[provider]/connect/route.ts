import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { maxIntegrations } from "@/lib/plan-limits"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { saveIntegrationCredential } from "@/lib/integrations/credentials"
import { clampDirection } from "@/lib/integrations/types"
import { integrationPullQueue, type IntegrationPullJobData } from "@/lib/queues"
import { resolveProvider, INTEGRATION_OAUTH_STATE_COOKIE } from "../../_shared"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import type { InvoiceSource } from "@prisma/client"

// GET — begin an OAuth2 connect (Xero, …). Sets a single-use CSRF nonce cookie
// and redirects to the provider's authorize URL. API-key providers use POST.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const origin = process.env.NEXTAUTH_URL!
  const { session, response } = await requirePrivileged()
  if (response) return NextResponse.redirect(new URL("/auth/signin", origin))
  void session

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider || !connectorImplemented(provider)) {
    return NextResponse.redirect(new URL("/settings?integration_error=unknown_provider", origin))
  }
  const connector = getConnector(provider)
  if (connector.authKind !== "oauth2" || !connector.getAuthUrl) {
    return NextResponse.redirect(new URL("/settings?integration_error=not_oauth", origin))
  }

  // State is a random single-use CSRF nonce — the callback takes the org from
  // the session, so state carries no authority.
  const state = randomBytes(32).toString("base64url")
  const cookieStore = await cookies()
  cookieStore.set(INTEGRATION_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  })
  return NextResponse.redirect(connector.getAuthUrl(state))
}

// Connect an accounting integration. API-key providers (Morning, …) POST their
// key here; the key is validated against the provider before we save it. OAuth
// providers use GET (Phase 4) instead — a POST to an oauth2 provider is a 400.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { session, response } = await requirePrivileged()
  if (response) return response
  const { organizationId } = session.user

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider || !connectorImplemented(provider)) {
    return NextResponse.json({ error: "Unknown or unsupported provider" }, { status: 404 })
  }
  const connector = getConnector(provider)
  if (connector.authKind !== "apiKey" || !connector.validateApiKey) {
    return NextResponse.json({ error: "This provider connects via OAuth, not an API key" }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    credentials?: Record<string, string>
    direction?: string
  }
  const credentials = body.credentials ?? {}
  const direction = clampDirection(body.direction ?? "BOTH", connector.capabilities)

  // Enforce the per-tier integration cap — only a genuinely NEW connection
  // counts; reconnecting an existing/soft-disconnected one never consumes a slot.
  const limitError = await enforceLimit(organizationId, provider)
  if (limitError) return limitError

  // Validate the key against the provider (round-trips its auth) before saving.
  let auth
  try {
    auth = await connector.validateApiKey(credentials)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not validate the API key" },
      { status: 400 }
    )
  }

  const cred = await saveIntegrationCredential({
    organizationId,
    provider,
    authKind: "apiKey",
    secrets: auth.secrets,
    externalAccountId: auth.externalAccountId ?? null,
    label: auth.label,
    direction,
  })

  // Kick off an immediate first pull so the user sees expenses without waiting
  // for the daily scheduler — only if this connection can pull.
  if (direction !== "PUSH" && connector.capabilities.canPull) {
    await integrationPullQueue().add("pull", {
      organizationId,
      integrationCredentialId: cred.id,
      mode: "full",
    } satisfies IntegrationPullJobData)
  }

  return NextResponse.json({ success: true, id: cred.id, direction })
}

// Block a new connection past the plan cap. Reconnecting a known account (same
// provider, already has a row) is always allowed.
async function enforceLimit(
  organizationId: string,
  provider: InvoiceSource
): Promise<NextResponse | null> {
  const [org, existing] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { planTier: true } }),
    prisma.integrationCredential.findFirst({
      where: { organizationId, provider },
      select: { id: true },
    }),
  ])
  if (existing || !org) return null
  const connectedCount = await prisma.integrationCredential.count({
    where: { organizationId, connected: true },
  })
  if (connectedCount >= maxIntegrations(org.planTier)) {
    return NextResponse.json({ error: "integration_limit" }, { status: 403 })
  }
  return null
}
