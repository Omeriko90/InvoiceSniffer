import type { DocumentType, IntegrationCredential, InvoiceSource } from "@prisma/client"

// The provider-agnostic contract every accounting-platform connector implements.
// Routes, workers and the settings UI are written against this interface only —
// adding a platform means adding one Connector to the registry, nothing else.
//
// Two auth families are supported:
//   'oauth2'  — redirect flow: getAuthUrl() -> callback -> exchangeCode()
//   'apiKey'  — the user pastes a key/secret we validate() before saving
// Both converge on authorize(), which returns ready-to-use request headers and
// refreshes/persists the stored secrets as a side effect when needed.

export type IntegrationDirection = "PULL" | "PUSH" | "BOTH"

export type ConnectorCapabilities = {
  canPull: boolean
  canPush: boolean
}

// What a connector emits for each document on PULL. Mapped into the Invoice model
// by ingestNormalizedInvoice() — see src/lib/integrations/ingest.ts. Only
// externalId, totalAmount and currency are required; everything else is best-effort.
export type NormalizedInvoice = {
  externalId: string // provider's document id — the dedup key
  externalRef?: string // deep link back to the document on the provider
  vendorName?: string
  vendorTaxId?: string
  invoiceNumber?: string
  allocationNumber?: string // Israeli Tax Authority clearance id (מספר הקצאה)
  documentType?: DocumentType
  invoiceDate?: Date
  totalAmount: number
  currency: string
  taxAmount?: number
  lineItems?: unknown[]
  receiptUrl?: string
}

// Result of a validated OAuth exchange or API-key check. `secrets` is the plain
// (unencrypted) JSON object we persist encrypted on IntegrationCredential.secrets.
export type AuthResult = {
  secrets: Record<string, unknown>
  externalAccountId?: string
  label?: string
}

// Ready-to-use auth material for a single request. `externalAccountId` is echoed
// back so connectors that resolve a tenant lazily can surface it.
export type Authorization = {
  headers: Record<string, string>
  externalAccountId?: string
}

// A minimal shape of the fields a connector needs to push an invoice. Kept
// structural (not the full Prisma Invoice) so pushInvoice() is easy to unit-test.
export type PushableInvoice = {
  id: string
  vendorName: string | null
  vendorTaxId: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  totalAmount: unknown // Prisma Decimal — connectors call Number() / .toString()
  currency: string
  taxAmount: unknown | null
  documentType: string // DocumentType enum value (TAX_INVOICE/RECEIPT/…)
  category: string
}

export interface Connector {
  provider: InvoiceSource
  authKind: "oauth2" | "apiKey"
  capabilities: ConnectorCapabilities

  // ── OAuth providers ──
  // Build the provider authorize URL (state = single-use CSRF nonce).
  getAuthUrl?(state: string): string
  // Exchange the authorization code for stored secrets + account identity.
  exchangeCode?(code: string): Promise<AuthResult>

  // ── API-key providers ──
  // Validate the pasted key/secret against the provider before we save it.
  validateApiKey?(input: Record<string, string>): Promise<AuthResult>

  // ── Both ──
  // Return request headers for the credential, refreshing + persisting the
  // stored token/JWT as a side effect when it is near expiry.
  authorize(cred: IntegrationCredential): Promise<Authorization>

  // Fetch received/expense documents since `cursor`. Present iff canPull.
  pullInvoices?(
    cred: IntegrationCredential,
    cursor: string | null
  ): Promise<{ items: NormalizedInvoice[]; nextCursor: string | null }>

  // Create/upsert an expense record on the provider from a reconciled invoice.
  // Returns the provider's id for InvoiceSync. Present iff canPush.
  pushInvoice?(
    cred: IntegrationCredential,
    invoice: PushableInvoice,
    externalCategoryId?: string
  ): Promise<{ externalId: string }>
}

// Does `direction` permit pulling / pushing? Used by workers and routes to gate
// each side against the user's per-account choice.
export function directionAllowsPull(direction: string): boolean {
  return direction === "PULL" || direction === "BOTH"
}

export function directionAllowsPush(direction: string): boolean {
  return direction === "PUSH" || direction === "BOTH"
}

// Clamp a requested direction to what the connector can actually do, so a
// pull-only provider can never be saved as PUSH/BOTH. Falls back to whichever
// single capability exists (or the request itself if somehow neither).
export function clampDirection(
  requested: string,
  caps: ConnectorCapabilities
): IntegrationDirection {
  const wantPull = requested === "PULL" || requested === "BOTH"
  const wantPush = requested === "PUSH" || requested === "BOTH"
  const pull = wantPull && caps.canPull
  const push = wantPush && caps.canPush
  if (pull && push) return "BOTH"
  if (push) return "PUSH"
  if (pull) return "PULL"
  // Requested direction isn't supported — default to the connector's sole capability.
  if (caps.canPull) return "PULL"
  if (caps.canPush) return "PUSH"
  return "PULL"
}
