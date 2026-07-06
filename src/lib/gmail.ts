import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/encryption"

// gmail.readonly is a superset of gmail.metadata and also allows fetching
// attachment content during export, which the metadata scope forbids
export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  )
}

export function getGmailAuthUrl(state: string): string {
  const oauth2Client = createOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent", // force refresh_token to be returned
    state,
  })
}

// Returns an authenticated Gmail API client for a given org, auto-refreshing if needed
export async function getGmailClient(organizationId: string) {
  const credential = await prisma.gmailCredential.findUnique({
    where: { organizationId },
  })

  if (!credential) throw new GmailNotConnectedError()

  const oauth2Client = createOAuthClient()

  oauth2Client.setCredentials({
    access_token: decrypt(credential.accessToken),
    refresh_token: decrypt(credential.refreshToken),
    expiry_date: credential.expiresAt.getTime(),
  })

  // Refresh token if expired or expiring in the next 5 minutes
  const expiresAt = credential.expiresAt.getTime()
  const isExpiringSoon = Date.now() > expiresAt - 5 * 60 * 1000

  if (isExpiringSoon) {
    const { credentials } = await oauth2Client.refreshAccessToken()

    await prisma.gmailCredential.update({
      where: { organizationId },
      data: {
        accessToken: encrypt(credentials.access_token!),
        expiresAt: new Date(credentials.expiry_date!),
      },
    })

    oauth2Client.setCredentials(credentials)
  }

  return google.gmail({ version: "v1", auth: oauth2Client })
}

export async function saveGmailCredential(
  organizationId: string,
  tokens: {
    access_token: string
    refresh_token: string
    expiry_date: number
    scope: string
  }
) {
  const scopes = tokens.scope.split(" ")

  await prisma.gmailCredential.upsert({
    where: { organizationId },
    create: {
      organizationId,
      email: "", // filled in after fetching profile
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date),
      scopes,
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date),
      scopes,
    },
  })
}

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail not connected for this organization")
    this.name = "GmailNotConnectedError"
  }
}
