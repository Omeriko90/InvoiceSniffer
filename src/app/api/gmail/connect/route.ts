import { requirePrivileged } from "@/lib/authz"
import { getGmailAuthUrl, GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function GET() {
  const { response } = await requirePrivileged()
  if (response) return response

  // State is a random, single-use CSRF nonce — NOT the org id. The callback
  // takes the org from the authenticated session, so state carries no
  // authority and can't be forged to target another org.
  const state = randomBytes(32).toString("base64url")
  const cookieStore = await cookies()
  cookieStore.set(GMAIL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent on Google's top-level redirect back to us
    path: "/",
    maxAge: 600, // 10 minutes
  })

  const url = getGmailAuthUrl(state)
  return NextResponse.redirect(url)
}
