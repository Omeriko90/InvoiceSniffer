import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { saveGmailCredential, GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail"
import { maxGmailAccounts } from "@/lib/plan-limits"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { timingSafeEqual } from "crypto"

function statesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

export async function GET(req: NextRequest) {
  // Behind Cloud Run / a proxy, req.url resolves to the container's internal
  // bind address (0.0.0.0:80), so redirects built from it send the browser to
  // a dead host. Base every redirect on the public origin instead.
  const origin = process.env.NEXTAUTH_URL!

  // Require an authenticated session — the org to connect comes from here,
  // never from a client-supplied parameter
  const session = await auth()
  if (!session) return NextResponse.redirect(new URL("/auth/signin", origin))

  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?gmail_error=${encodeURIComponent(error)}`, origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?gmail_error=missing_params", origin))
  }

  // Validate the single-use CSRF nonce set during /connect, then clear it
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE)
  if (!expectedState || !statesMatch(state, expectedState)) {
    return NextResponse.redirect(new URL("/settings?gmail_error=invalid_state", origin))
  }

  const organizationId = session.user.organizationId

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  )

  let tokens
  try {
    ;({ tokens } = await oauth2Client.getToken(code))
  } catch {
    return NextResponse.redirect(new URL("/settings?gmail_error=token_exchange_failed", origin))
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(new URL("/settings?gmail_error=no_tokens", origin))
  }

  oauth2Client.setCredentials(tokens)

  // Fetch the Gmail address — it's the upsert key and the plan-limit check
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  const profile = await gmail.users.getProfile({ userId: "me" })
  const gmailEmail = profile.data.emailAddress!

  // Enforce the per-tier mailbox cap. Only a genuinely NEW address counts —
  // re-connecting a known (or soft-disconnected) address is always allowed and
  // never consumes a slot.
  const [org, existing] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { planTier: true },
    }),
    prisma.gmailCredential.findUnique({
      where: { organizationId_email: { organizationId, email: gmailEmail } },
      select: { id: true },
    }),
  ])

  if (!existing && org) {
    const connectedCount = await prisma.gmailCredential.count({
      where: { organizationId, connected: true },
    })
    if (connectedCount >= maxGmailAccounts(org.planTier)) {
      return NextResponse.redirect(new URL("/settings?gmail_error=account_limit", origin))
    }
  }

  await saveGmailCredential(organizationId, gmailEmail, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope!,
  })

  return NextResponse.redirect(new URL("/settings?gmail_connected=true", origin))
}
