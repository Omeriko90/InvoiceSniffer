async function triggerGmailSync(): Promise<{ jobId: string; mode: string }> {
  const res = await fetch("/api/gmail/sync", { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to start Gmail sync")
  }
  return res.json()
}

export { triggerGmailSync }
