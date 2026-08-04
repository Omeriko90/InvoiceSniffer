import type { DocumentType, IntegrationCredential } from "@prisma/client"
import { readSecrets, persistSecrets } from "../credentials"
import type {
  AuthResult,
  Authorization,
  Connector,
  NormalizedInvoice,
  PushableInvoice,
} from "../types"

// Morning (Green Invoice) connector — Israeli invoicing platform, per-org API
// key. Auth is a token exchange: POST /account/token with the org's {id, secret}
// returns a short-lived JWT we cache in the encrypted secrets blob and refresh
// like Gmail refreshes its access token.
//
// PULL fetches received "expense" documents (supplier bills = money the business
// owes) via POST /expenses/search. PUSH (Phase 3) creates expense records.
//
// Base URL, auth shape, endpoints and document-type codes verified against the
// live API (greeninvoice-mcp, 2026). Individual expense response field names are
// mapped defensively in mapExpense() — confirm against a real pull if a field
// comes back empty.

const MORNING_BASE = "https://api.greeninvoice.co.il/api/v1"
// Refresh the JWT this many ms before its stated expiry, so an in-flight request
// never races the expiry boundary.
const JWT_SKEW_MS = 120_000
const PAGE_SIZE = 100
// First-ever pull lookback when there's no lastPulledAt to anchor on.
const DEFAULT_LOOKBACK_DAYS = 550

type MorningSecrets = {
  id: string
  secret: string
  jwt?: string
  jwtExpires?: number // unix seconds (as returned by /account/token)
}

// Exchange id/secret for a fresh JWT. Shared by validateApiKey (connect) and the
// token cache (authorize).
async function fetchToken(id: string, secret: string): Promise<{ token: string; expires: number }> {
  const res = await fetch(`${MORNING_BASE}/account/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, secret }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Morning auth failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { token?: string; expires?: number }
  const token = data.token ?? res.headers.get("X-Authorization-Bearer") ?? ""
  if (!token) throw new Error("Morning auth returned no token")
  // expires is unix seconds; default to ~55 min out if the field is ever absent.
  const expires = data.expires ?? Math.floor(Date.now() / 1000) + 55 * 60
  return { token, expires }
}

// Return a valid JWT for this credential, refreshing + persisting into the
// secrets blob when it's missing or near expiry.
async function getValidToken(cred: IntegrationCredential): Promise<string> {
  const secrets = readSecrets<MorningSecrets>(cred)
  const stillFresh =
    secrets.jwt && secrets.jwtExpires && secrets.jwtExpires * 1000 - JWT_SKEW_MS > Date.now()
  if (stillFresh) return secrets.jwt!

  const { token, expires } = await fetchToken(secrets.id, secrets.secret)
  await persistSecrets(cred.id, { ...secrets, jwt: token, jwtExpires: expires })
  return token
}

// Authenticated request with a one-shot refresh-and-retry on 401 (the cached JWT
// may have expired between refreshes). Returns parsed JSON.
async function morningRequest<T>(
  cred: IntegrationCredential,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const call = async (token: string) =>
    fetch(`${MORNING_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    })

  let res = await call(await getValidToken(cred))
  if (res.status === 401) {
    // Force a fresh token and retry once.
    const secrets = readSecrets<MorningSecrets>(cred)
    const { token, expires } = await fetchToken(secrets.id, secrets.secret)
    await persistSecrets(cred.id, { ...secrets, jwt: token, jwtExpires: expires })
    res = await call(token)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Morning API error (${res.status}) on ${path}: ${text}`)
  }
  return res.json() as Promise<T>
}

// Morning expense document-type codes → our DocumentType. Same codes as the
// documents API: 305 Tax Invoice, 320 Tax Invoice+Receipt, 400 Receipt,
// 330/332 Credit; everything else is UNKNOWN.
function mapDocType(code: unknown): DocumentType {
  switch (Number(code)) {
    case 305:
    case 320:
      return "TAX_INVOICE"
    case 400:
      return "RECEIPT"
    case 330:
    case 332:
      return "CREDIT_INVOICE"
    default:
      return "UNKNOWN"
  }
}

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? undefined : d
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return isNaN(n) ? undefined : n
}

// A single Morning expense → NormalizedInvoice. Field names follow Morning's
// expense/document schema; kept tolerant (supplier may be nested or flat).
function mapExpense(e: Record<string, unknown>): NormalizedInvoice | null {
  const id = e.id ?? e._id
  if (id == null) return null
  const supplier = (e.supplier ?? {}) as Record<string, unknown>
  const amount = toNumber(e.amount) ?? 0
  return {
    externalId: String(id),
    externalRef: `https://app.morning.co.il/expenses/${id}`,
    vendorName:
      (supplier.name as string) ?? (e.supplierName as string) ?? (e.description as string) ?? undefined,
    vendorTaxId:
      (supplier.taxId as string) ??
      (supplier.businessNumber as string) ??
      (supplier.vatId as string) ??
      undefined,
    invoiceNumber: e.number != null ? String(e.number) : undefined,
    documentType: mapDocType(e.documentType),
    invoiceDate: parseDate(e.date ?? e.documentDate ?? e.reportingDate),
    totalAmount: amount,
    currency: (e.currency as string) ?? "ILS",
    taxAmount: toNumber(e.vat),
    lineItems: Array.isArray(e.items) ? (e.items as unknown[]) : undefined,
  }
}

type ExpenseSearchResponse = {
  items?: Record<string, unknown>[]
  // Morning search responses have used both `items` and `data`; tolerate either.
  data?: Record<string, unknown>[]
  total?: number
}

// Our DocumentType → Morning expense document-type code (used on create/PUSH).
// 320 (Tax Invoice+Receipt) is the safe default — Morning rejects the 10/20/30/40
// enum with error 3308.
function toMorningDocType(type: string): number {
  switch (type) {
    case "RECEIPT":
      return 400
    case "CREDIT_INVOICE":
      return 330
    case "TAX_INVOICE":
    default:
      return 320
  }
}

// Morning requires an accountingClassification on expense create (error 3312
// otherwise). We use the per-category mapping when the user configured one; else
// we fall back to the account's first classification, cached briefly per
// credential to avoid re-fetching on every invoice in a bulk push.
const classificationCache = new Map<string, { id: string; at: number }>()
const CLASSIFICATION_TTL_MS = 10 * 60 * 1000

async function defaultClassificationId(cred: IntegrationCredential): Promise<string | undefined> {
  const cached = classificationCache.get(cred.id)
  if (cached && Date.now() - cached.at < CLASSIFICATION_TTL_MS) return cached.id
  try {
    const res = await morningRequest<unknown>(cred, "GET", "/accounting/classifications/map")
    // The map endpoint's shape isn't strictly documented; accept an array of
    // {id,...} or an object keyed by id and take the first stable id.
    let id: string | undefined
    if (Array.isArray(res) && res.length > 0) {
      id = String((res[0] as Record<string, unknown>).id ?? (res[0] as Record<string, unknown>).key ?? "")
    } else if (res && typeof res === "object") {
      const first = Object.values(res as Record<string, unknown>)[0] as Record<string, unknown> | undefined
      id = first ? String(first.id ?? first.key ?? "") : Object.keys(res as object)[0]
    }
    if (id) {
      classificationCache.set(cred.id, { id, at: Date.now() })
      return id
    }
  } catch {
    // Fall through — let create fail with Morning's own message if there's
    // genuinely no classification to use.
  }
  return undefined
}

export const morningConnector: Connector = {
  provider: "MORNING",
  authKind: "apiKey",
  capabilities: { canPull: true, canPush: true },

  async validateApiKey(input: Record<string, string>): Promise<AuthResult> {
    const id = input.id?.trim()
    const secret = input.secret?.trim()
    if (!id || !secret) throw new Error("Morning requires both an API key id and secret")
    // Round-trips the real /account/token so a bad key is rejected before we save.
    const { token, expires } = await fetchToken(id, secret)
    return {
      secrets: { id, secret, jwt: token, jwtExpires: expires } satisfies MorningSecrets,
      label: "Morning",
    }
  },

  async authorize(cred: IntegrationCredential): Promise<Authorization> {
    const token = await getValidToken(cred)
    return { headers: { Authorization: `Bearer ${token}` } }
  },

  async pullInvoices(cred: IntegrationCredential, cursor: string | null) {
    // cursor = 1-based page index within a sync run. Bound the search by date:
    // resume from lastPulledAt (with the whole run overlapping a little, which
    // is safe because ingest upserts), or a wide lookback on the first pull.
    const page = cursor ? Number(cursor) : 1
    const since = cred.lastPulledAt
      ? new Date(cred.lastPulledAt.getTime() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

    const body = {
      page,
      pageSize: PAGE_SIZE,
      fromDate: since.toISOString().slice(0, 10),
      toDate: new Date().toISOString().slice(0, 10),
    }
    const res = await morningRequest<ExpenseSearchResponse>(cred, "POST", "/expenses/search", body)
    const rows = res.items ?? res.data ?? []
    const items = rows.map(mapExpense).filter((x): x is NormalizedInvoice => x !== null)

    // Another page exists only if this one came back full.
    const nextCursor = rows.length === PAGE_SIZE ? String(page + 1) : null
    return { items, nextCursor }
  },

  // Create an expense record on Morning from a reconciled invoice. externalCategoryId
  // (from the per-connection category map) becomes the accountingClassification;
  // when absent we fall back to the account's default classification. Returns the
  // created expense id for the InvoiceSync ledger.
  //
  // Field requirements verified against the live API: reportingDate and
  // accountingClassification are mandatory; documentType must be a real doc-type
  // code (320 etc.), not the status enum. Supplier is sent inline (name + tax id);
  // confirm against your account whether an existing supplier id is required.
  async pushInvoice(
    cred: IntegrationCredential,
    invoice: PushableInvoice,
    externalCategoryId?: string
  ): Promise<{ externalId: string }> {
    const classificationId = externalCategoryId ?? (await defaultClassificationId(cred))
    const date = invoice.invoiceDate ?? new Date()
    const dateStr = date.toISOString().slice(0, 10)
    // Reporting month — Morning validates this (error 3310 on a bad month).
    const reportingDate = `${dateStr.slice(0, 7)}-01`

    const body: Record<string, unknown> = {
      documentType: toMorningDocType(invoice.documentType),
      amount: Number(String(invoice.totalAmount)),
      vat: invoice.taxAmount != null ? Number(String(invoice.taxAmount)) : 0,
      currency: invoice.currency,
      date: dateStr,
      reportingDate,
      number: invoice.invoiceNumber ?? undefined,
      description: invoice.vendorName ?? undefined,
      supplier: {
        name: invoice.vendorName ?? undefined,
        taxId: invoice.vendorTaxId ?? undefined,
      },
      ...(classificationId ? { accountingClassification: { id: classificationId } } : {}),
    }

    const res = await morningRequest<{ id?: string | number }>(cred, "POST", "/expenses", body)
    const id = res.id
    if (id == null) throw new Error("Morning expense create returned no id")
    return { externalId: String(id) }
  },
}
