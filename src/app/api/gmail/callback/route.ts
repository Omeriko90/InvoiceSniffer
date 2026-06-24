import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import { saveGmailCredential } from "@/lib/gmail"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?gmail_error=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?gmail_error=missing_params", req.url))
  }

  const organizationId = Buffer.from(state, "base64url").toString("utf8")

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(new URL("/settings?gmail_error=no_tokens", req.url))
  }

  oauth2Client.setCredentials(tokens)

  // Fetch the Gmail address to store alongside the credential
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  const profile = await gmail.users.getProfile({ userId: "me" })
  const gmailEmail = profile.data.emailAddress!

  await saveGmailCredential(organizationId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope!,
  })

  // Store the Gmail email address
  await prisma.gmailCredential.update({
    where: { organizationId },
    data: { email: gmailEmail },
  })

  // Mark the org as Gmail-connected
  await prisma.organization.update({
    where: { id: organizationId },
    data: { gmailConnected: true },
  })

  return NextResponse.redirect(new URL("/settings?gmail_connected=true", req.url))
}
