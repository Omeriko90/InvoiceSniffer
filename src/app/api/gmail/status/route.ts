import { auth } from "@/lib/auth"
import { listGmailCredentialStatuses } from "@/lib/gmail"
import { NextResponse } from "next/server"

// GET /api/gmail/status — lightweight connection status for the topbar pill.
// Includes soft-disconnected accounts so the UI can flag "out of sync".
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await listGmailCredentialStatuses(session.user.organizationId)

  const connected = accounts.filter((a) => a.connected)
  const outOfSync = accounts.filter((a) => !a.connected)
  // Most recent sync across connected mailboxes, for the "synced · <time>" label.
  const lastSyncedAt = connected
    .map((a) => a.lastSyncedAt)
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      email: a.email,
      label: a.label,
      connected: a.connected,
      lastSyncedAt: a.lastSyncedAt,
    })),
    hasAccounts: accounts.length > 0,
    anyConnected: connected.length > 0,
    outOfSyncCount: outOfSync.length,
    lastSyncedAt,
  })
}
