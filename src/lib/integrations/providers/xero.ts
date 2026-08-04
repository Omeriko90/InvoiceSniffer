import type { IntegrationCredential } from "@prisma/client"
import { readSecrets, persistSecrets } from "../credentials"
import type { AuthResult, Authorization, Connector, NormalizedInvoice } from "../types"

// Xero connector — global accounting platform, OAuth2 authorization-code flow.
// This is the reference OAuth connector (template for QuickBooks / FreshBooks).
//
// Two Xero-specific wrinkles the abstraction has to absorb:
//  1. Tenant: after the token exchange you call GET /connections to discover the
//     organisation(s) the user granted; we store the chosen tenantId as
//     externalAccountId and send it as the `Xero-tenant-id` header on every call.
//  2. Rotating refresh tokens: each refresh returns a NEW refresh_token that must
//     replace the old one, or the connection dies.
//
// PULL fetches ACCPAY invoices (supplier bills = the org's expenses). PUSH
// (create ACCPAY invoices) is deferred — capabilities.canPush is false for now.

const AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize"
const TOKEN_URL = "https://identity.xero.com/connect/token"
const CONNECTIONS_URL = "https://api.xero.com/connections"
const API_BASE = "https://api.xero.com/api.xro/2.0"
const SCOPES = "openid profile email accounting.transactions.read accounting.contacts.read offline_access"
const TOKEN_SKEW_MS = 120_000
const PAGE_SIZE = 100

type XeroSecrets = {
  accessToken: string
  refreshToken: string
  expiresAt: number // ms epoch
}

function clientId(): string {
  const id = process.env.XERO_CLIENT_ID
  if (!id) throw new Error("XERO_CLIENT_ID is not set")
  return id
}
function clientSecret(): string {
  const secret = process.env.XERO_CLIENT_SECRET
  if (!secret) throw new Error("XERO_CLIENT_SECRET is not set")
  return secret
}
function redirectUri(): string {
  return `${process.env.NEXTAUTH_URL}/api/integrations/xero/callback`
}
function basicAuth(): string {
  return "Basic " + Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64")
}

// Exchange a code or refresh token for a token set. Xero returns expires_in
// (seconds) and a rotating refresh_token.
async function tokenExchange(params: Record<string, string>): Promise<XeroSecrets> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Xero token exchange failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Return a valid access token, refreshing + persisting (with the rotated refresh
// token) when it's near expiry.
async function getValidToken(cred: IntegrationCredential): Promise<string> {
  const secrets = readSecrets<XeroSecrets>(cred)
  if (secrets.expiresAt - TOKEN_SKEW_MS > Date.now()) return secrets.accessToken
  const refreshed = await tokenExchange({
    grant_type: "refresh_token",
    refresh_token: secrets.refreshToken,
  })
  await persistSecrets(cred.id, refreshed)
  return refreshed.accessToken
}

// Xero serialises dates as Microsoft JSON (`/Date(1516309200000+0000)/`) even in
// JSON responses. Fall back to the native parser for ISO strings.
function parseXeroDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined
  const ms = value.match(/\/Date\((\d+)/)
  if (ms) return new Date(Number(ms[1]))
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

function mapInvoice(inv: Record<string, unknown>): NormalizedInvoice | null {
  const id = inv.InvoiceID
  if (id == null) return null
  const contact = (inv.Contact ?? {}) as Record<string, unknown>
  return {
    externalId: String(id),
    externalRef: `https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${id}`,
    vendorName: (contact.Name as string) ?? undefined,
    invoiceNumber: (inv.InvoiceNumber as string) ?? undefined,
    documentType: "TAX_INVOICE",
    invoiceDate: parseXeroDate(inv.Date),
    totalAmount: Number(inv.Total ?? 0),
    currency: (inv.CurrencyCode as string) ?? "USD",
    taxAmount: inv.TotalTax != null ? Number(inv.TotalTax) : undefined,
  }
}

export const xeroConnector: Connector = {
  provider: "XERO",
  authKind: "oauth2",
  // PULL only for now — PUSH (create ACCPAY invoices) is a later phase.
  capabilities: { canPull: true, canPush: false },

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId(),
      redirect_uri: redirectUri(),
      scope: SCOPES,
      state,
    })
    return `${AUTHORIZE_URL}?${params}`
  },

  async exchangeCode(code: string): Promise<AuthResult> {
    const secrets = await tokenExchange({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    })
    // Discover the granted organisation(s) and pin to the first tenant.
    const res = await fetch(CONNECTIONS_URL, {
      headers: { Authorization: `Bearer ${secrets.accessToken}`, Accept: "application/json" },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Xero /connections failed (${res.status}): ${text}`)
    }
    const connections = (await res.json()) as { tenantId: string; tenantName?: string }[]
    const tenant = connections[0]
    if (!tenant) throw new Error("Xero returned no organisations for this login")
    return {
      secrets: secrets as unknown as Record<string, unknown>,
      externalAccountId: tenant.tenantId,
      label: tenant.tenantName ?? "Xero",
    }
  },

  async authorize(cred: IntegrationCredential): Promise<Authorization> {
    const token = await getValidToken(cred)
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Xero-tenant-id": cred.externalAccountId ?? "",
        Accept: "application/json",
      },
      externalAccountId: cred.externalAccountId ?? undefined,
    }
  },

  async pullInvoices(cred: IntegrationCredential, cursor: string | null) {
    const page = cursor ? Number(cursor) : 1
    const { headers } = await this.authorize!(cred)
    // ACCPAY = bills we owe = our expenses. Incremental via If-Modified-Since.
    const url = `${API_BASE}/Invoices?where=${encodeURIComponent('Type=="ACCPAY"')}&page=${page}`
    const reqHeaders: Record<string, string> = { ...headers }
    if (cred.lastPulledAt) reqHeaders["If-Modified-Since"] = cred.lastPulledAt.toUTCString()

    const res = await fetch(url, { headers: reqHeaders })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Xero Invoices fetch failed (${res.status}): ${text}`)
    }
    const data = (await res.json()) as { Invoices?: Record<string, unknown>[] }
    const rows = data.Invoices ?? []
    const items = rows.map(mapInvoice).filter((x): x is NormalizedInvoice => x !== null)
    const nextCursor = rows.length === PAGE_SIZE ? String(page + 1) : null
    return { items, nextCursor }
  },
}
