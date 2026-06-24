import { auth } from "@/lib/auth"
import { getGmailAuthUrl } from "@/lib/gmail"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // State encodes organizationId so we can retrieve it in the callback
  const state = Buffer.from(session.user.organizationId).toString("base64url")
  const url = getGmailAuthUrl(state)

  return NextResponse.redirect(url)
}
