export type GmailStatusAccount = {
  id: string
  email: string
  label: string | null
  connected: boolean
  lastSyncedAt: string | null
}

export type GmailStatus = {
  accounts: GmailStatusAccount[]
  hasAccounts: boolean
  anyConnected: boolean
  outOfSyncCount: number
  lastSyncedAt: string | null
}

async function fetchGmailStatus(): Promise<GmailStatus> {
  const res = await fetch("/api/gmail/status")
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to load Gmail status")
  }
  return res.json()
}

async function triggerGmailSync(credentialId: string): Promise<{ jobId: string; mode: string }> {
  const res = await fetch("/api/gmail/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentialId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to start Gmail sync")
  }
  return res.json()
}

export { triggerGmailSync, fetchGmailStatus }
