import type { InvoiceSource } from "@prisma/client"
import { PROVIDER_META } from "@/lib/integrations/registry"

// httpOnly cookie holding the single-use OAuth CSRF nonce during an integration
// connect handshake. Same role as GMAIL_OAUTH_STATE_COOKIE.
export const INTEGRATION_OAUTH_STATE_COOKIE = "integration_oauth_state"

// Map a URL slug (e.g. "morning") to the InvoiceSource enum, rejecting GMAIL
// (which has its own /api/gmail routes) and anything not in the provider catalog.
export function resolveProvider(slug: string): InvoiceSource | null {
  const upper = slug.toUpperCase()
  if (upper === "GMAIL") return null
  return upper in PROVIDER_META ? (upper as InvoiceSource) : null
}
