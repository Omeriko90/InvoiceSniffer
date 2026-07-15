import { SettingsData } from "@/api-types/settings"

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

export { fetchSettings, deleteAlias, disconnectGmail, updateSettlementLag }
