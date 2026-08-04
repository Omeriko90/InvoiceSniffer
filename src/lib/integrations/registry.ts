import type { InvoiceSource } from "@prisma/client"
import type { Connector, ConnectorCapabilities } from "./types"
import { morningConnector } from "./providers/morning"
import { xeroConnector } from "./providers/xero"

// Display metadata for every accounting platform we intend to support, shown in
// the Settings > Integrations UI regardless of whether the connector is wired up
// yet (`implemented` gates the connect button). The connector implementations
// themselves live in ./providers and register into CONNECTORS below as they land.
export type ProviderMeta = {
  provider: InvoiceSource
  name: string
  authKind: "oauth2" | "apiKey"
  capabilities: ConnectorCapabilities
  // Israeli platforms use per-org API keys; global ones use a shared OAuth app.
  region: "IL" | "GLOBAL"
  implemented: boolean
}

const CAP_BOTH: ConnectorCapabilities = { canPull: true, canPush: true }
const CAP_PULL: ConnectorCapabilities = { canPull: true, canPush: false }

export const PROVIDER_META: Record<Exclude<InvoiceSource, "GMAIL">, ProviderMeta> = {
  MORNING: { provider: "MORNING", name: "Morning (Green Invoice)", authKind: "apiKey", capabilities: CAP_BOTH, region: "IL", implemented: false },
  XERO: { provider: "XERO", name: "Xero", authKind: "oauth2", capabilities: CAP_PULL, region: "GLOBAL", implemented: false },
  ICOUNT: { provider: "ICOUNT", name: "iCount", authKind: "apiKey", capabilities: CAP_BOTH, region: "IL", implemented: false },
  QUICKBOOKS: { provider: "QUICKBOOKS", name: "QuickBooks Online", authKind: "oauth2", capabilities: CAP_BOTH, region: "GLOBAL", implemented: false },
  FRESHBOOKS: { provider: "FRESHBOOKS", name: "FreshBooks", authKind: "oauth2", capabilities: CAP_BOTH, region: "GLOBAL", implemented: false },
  SUMIT: { provider: "SUMIT", name: "Sumit", authKind: "apiKey", capabilities: CAP_BOTH, region: "IL", implemented: false },
  BIZIBOX: { provider: "BIZIBOX", name: "Bizibox", authKind: "apiKey", capabilities: CAP_PULL, region: "IL", implemented: false },
  TAKZIVIT: { provider: "TAKZIVIT", name: "Takzivit", authKind: "apiKey", capabilities: CAP_PULL, region: "IL", implemented: false },
  PAPERLESS: { provider: "PAPERLESS", name: "Paperless", authKind: "apiKey", capabilities: CAP_PULL, region: "IL", implemented: false },
}

// Live connectors, keyed by provider. Populated by ./providers modules as each
// connector is implemented; a provider absent here is "coming soon" in the UI.
export const CONNECTORS: Partial<Record<InvoiceSource, Connector>> = {
  MORNING: morningConnector,
  XERO: xeroConnector,
}

export function getConnector(provider: InvoiceSource): Connector {
  const connector = CONNECTORS[provider]
  if (!connector) throw new Error(`No connector implemented for provider ${provider}`)
  return connector
}

export function connectorImplemented(provider: InvoiceSource): boolean {
  return provider in CONNECTORS
}

// The provider list for the Settings UI, with `implemented` reflecting whether a
// live connector is actually registered (so metadata can't drift from reality).
export function providerCatalog(): ProviderMeta[] {
  return Object.values(PROVIDER_META).map((m) => ({
    ...m,
    implemented: connectorImplemented(m.provider),
  }))
}

// The connector's real capabilities if implemented, else the catalog metadata's
// (so the UI can still show accurate Pull/Push badges for "coming soon" ones).
export function providerCapabilities(provider: InvoiceSource): ConnectorCapabilities {
  const connector = CONNECTORS[provider]
  if (connector) return connector.capabilities
  const meta = provider === "GMAIL" ? undefined : PROVIDER_META[provider]
  return meta?.capabilities ?? { canPull: false, canPush: false }
}
