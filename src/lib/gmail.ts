import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/encryption"

// gmail.readonly is a superset of gmail.metadata and also allows fetching
// attachment content during export, which the metadata scope forbids
export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

// Cookie holding the single-use OAuth CSRF nonce (set in /connect, checked in /callback)
export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state"

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

// Returns an authenticated Gmail API client for a given credential, auto-refreshing
// if needed. Keyed by credential id so a message can be routed to the exact mailbox
// it lives in — organizationId alone is ambiguous once an org has several mailboxes.
export async function getGmailClient(credentialId: string) {
  const credential = await prisma.gmailCredential.findUnique({
    where: { id: credentialId },
  })

  // A missing row or a soft-disconnected one (tokens zeroed) can't authenticate
  if (!credential || !credential.connected || !credential.refreshToken) {
    throw new GmailNotConnectedError()
  }

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
      where: { id: credentialId },
      data: {
        accessToken: encrypt(credentials.access_token!),
        expiresAt: new Date(credentials.expiry_date!),
      },
    })

    oauth2Client.setCredentials(credentials)
  }

  return google.gmail({ version: "v1", auth: oauth2Client })
}

// Connected credentials for an org, newest first. Never returns secrets.
export async function listGmailCredentials(organizationId: string) {
  return prisma.gmailCredential.findMany({
    where: { organizationId, connected: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      label: true,
      lastSyncedAt: true,
      syncToken: true,
      expiresAt: true,
    },
  })
}

// Upsert keyed by (organizationId, email): a new address creates an additional
// credential, while re-connecting a known address (including a soft-disconnected
// one) refreshes its tokens in place and re-activates it without touching other
// accounts or its accumulated sync state. Returns the credential id.
export async function saveGmailCredential(
  organizationId: string,
  email: string,
  tokens: {
    access_token: string
    refresh_token: string
    expiry_date: number
    scope: string
  }
): Promise<string> {
  const scopes = tokens.scope.split(" ")

  const credential = await prisma.gmailCredential.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: {
      organizationId,
      email,
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
      connected: true, // re-activate a soft-disconnected row; syncToken preserved
    },
    select: { id: true },
  })

  return credential.id
}

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail not connected for this organization")
    this.name = "GmailNotConnectedError"
  }
}
