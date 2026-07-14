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

export { triggerGmailSync }
