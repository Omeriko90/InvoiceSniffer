import type { Session } from "next-auth"
import type { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Roles allowed to perform privileged/administrative actions — the Gmail
// connection lifecycle, member management, and destructive settings changes.
// Regular MEMBERs can read and work with data but not reconfigure the org.
const PRIVILEGED_ROLES: readonly UserRole[] = ["OWNER", "ADMIN"]

type AuthzResult =
  | { session: Session; response?: undefined }
  | { session?: undefined; response: NextResponse }

// Require an authenticated session. Returns either the session or a 401 the
// caller should return immediately.
export async function requireSession(): Promise<AuthzResult> {
  const session = await auth()
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session }
}

// Require an authenticated session AND a privileged role. Returns the session,
// a 401 (not signed in), or a 403 (signed in but insufficient role). Gate every
// route that reconfigures the org or performs destructive admin actions with
// this so a future MEMBER can't act as an OWNER.
export async function requirePrivileged(): Promise<AuthzResult> {
  const result = await requireSession()
  if (result.response) return result
  if (!PRIVILEGED_ROLES.includes(result.session.user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session: result.session }
}
