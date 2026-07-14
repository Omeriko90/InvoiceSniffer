import { requirePrivileged } from "@/lib/authz"
import { enforceRateLimit } from "@/lib/rate-limit"
import { runMatching } from "@/lib/run-matching"
import { NextResponse } from "next/server"

export async function POST() {
  // Re-running matching is an org-level operation; restrict to OWNER/ADMIN.
  const { session, response } = await requirePrivileged()
  if (response) return response

  const { organizationId } = session.user

  // A full matching pass runs synchronously; cap to 10/min per org.
  const limited = await enforceRateLimit(`reconcile-run:${organizationId}`, 10, 60_000)
  if (limited) return limited

  const result = await runMatching(organizationId)
  return NextResponse.json(result)
}
