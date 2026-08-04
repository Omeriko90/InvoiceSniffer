import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { maxIntegrations } from "@/lib/plan-limits"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { saveIntegrationCredential } from "@/lib/integrations/credentials"
import { clampDirection } from "@/lib/integrations/types"
import { integrationPullQueue, type IntegrationPullJobData } from "@/lib/queues"
import { resolveProvider, INTEGRATION_OAUTH_STATE_COOKIE } from "../../_shared"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { timingSafeEqual } from "crypto"

function statesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

// GET — OAuth2 redirect target. Validates the CSRF nonce, exchanges the code,
// persists the credential, and redirects back to Settings. Mirrors the Gmail
// callback but parameterized by provider.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const origin = process.env.NEXTAUTH_URL!
  const err = (code: string) =>
    NextResponse.redirect(new URL(`/settings?integration_error=${code}`, origin))

  const session = await auth()
  if (!session) return NextResponse.redirect(new URL("/auth/signin", origin))
  const { organizationId } = session.user

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider || !connectorImplemented(provider)) return err("unknown_provider")
  const connector = getConnector(provider)
  if (connector.authKind !== "oauth2" || !connector.exchangeCode) return err("not_oauth")

  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  if (searchParams.get("error")) return err(encodeURIComponent(searchParams.get("error")!))
  if (!code || !state) return err("missing_params")

  // Validate + clear the single-use CSRF nonce.
  const cookieStore = await cookies()
  const expected = cookieStore.get(INTEGRATION_OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(INTEGRATION_OAUTH_STATE_COOKIE)
  if (!expected || !statesMatch(state, expected)) return err("invalid_state")

  let authResult
  try {
    authResult = await connector.exchangeCode(code)
  } catch {
    return err("token_exchange_failed")
  }

  // Enforce the plan cap — only a genuinely new connection counts.
  const [org, existing] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { planTier: true } }),
    prisma.integrationCredential.findFirst({
      where: { organizationId, provider, externalAccountId: authResult.externalAccountId ?? null },
      select: { id: true },
    }),
  ])
  if (!existing && org) {
    const connectedCount = await prisma.integrationCredential.count({
      where: { organizationId, connected: true },
    })
    if (connectedCount >= maxIntegrations(org.planTier)) return err("integration_limit")
  }

  // OAuth connect has no direction form; default to BOTH clamped to capabilities.
  // The user can change it afterward from the integration card.
  const direction = clampDirection("BOTH", connector.capabilities)
  const cred = await saveIntegrationCredential({
    organizationId,
    provider,
    authKind: "oauth2",
    secrets: authResult.secrets,
    externalAccountId: authResult.externalAccountId ?? null,
    label: authResult.label,
    direction,
  })

  if (direction !== "PUSH" && connector.capabilities.canPull) {
    await integrationPullQueue().add("pull", {
      organizationId,
      integrationCredentialId: cred.id,
      mode: "full",
    } satisfies IntegrationPullJobData)
  }

  return NextResponse.redirect(
    new URL(`/settings?integration_connected=${provider.toLowerCase()}`, origin)
  )
}
