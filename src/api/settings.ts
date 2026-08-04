import { SettingsData, IntegrationDirection, IntegrationProvider } from "@/api-types/settings"

async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to load settings")
  return res.json()
}

async function deleteAlias(id: string): Promise<void> {
  const res = await fetch(`/api/settings/aliases/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to remove rule")
}

async function disconnectGmail(credentialId: string): Promise<void> {
  const res = await fetch("/api/gmail/disconnect", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentialId }),
  })
  if (!res.ok) throw new Error("Failed to disconnect Gmail")
}

async function updateSettlementLag(settlementLagDays: number): Promise<void> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settlementLagDays }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to update settings")
  }
}

// ── Accounting integrations ──────────────────────────────────────────────

const providerSlug = (provider: IntegrationProvider) => provider.toLowerCase()

// Connect an API-key provider (Morning, …). Throws with the server's message so
// the form can show "invalid key" / "limit reached" verbatim.
async function connectIntegration(input: {
  provider: IntegrationProvider
  credentials: Record<string, string>
  direction: IntegrationDirection
}): Promise<void> {
  const res = await fetch(`/api/integrations/${providerSlug(input.provider)}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials: input.credentials, direction: input.direction }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to connect integration")
  }
}

async function disconnectIntegration(input: {
  provider: IntegrationProvider
  credentialId: string
}): Promise<void> {
  const res = await fetch(`/api/integrations/${providerSlug(input.provider)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentialId: input.credentialId }),
  })
  if (!res.ok) throw new Error("Failed to disconnect integration")
}

async function updateIntegrationDirection(input: {
  provider: IntegrationProvider
  credentialId: string
  direction: IntegrationDirection
}): Promise<void> {
  const res = await fetch(`/api/integrations/${providerSlug(input.provider)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentialId: input.credentialId, direction: input.direction }),
  })
  if (!res.ok) throw new Error("Failed to update integration")
}

// Push (export) invoices to a connected integration for bookkeeping.
async function pushToIntegration(input: {
  provider: IntegrationProvider
  invoiceIds: string[]
  credentialId?: string
}): Promise<{ queued: number }> {
  const res = await fetch(`/api/integrations/${providerSlug(input.provider)}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceIds: input.invoiceIds, credentialId: input.credentialId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to sync")
  }
  return res.json()
}

export {
  fetchSettings,
  deleteAlias,
  disconnectGmail,
  updateSettlementLag,
  connectIntegration,
  disconnectIntegration,
  updateIntegrationDirection,
  pushToIntegration,
}
