import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(req: NextRequest) {
  const { session, response } = await requirePrivileged()
  if (response) return response

  const { organizationId } = session.user

  const { credentialId } = (await req.json().catch(() => ({}))) as { credentialId?: string }
  if (!credentialId) {
    return NextResponse.json({ error: "credentialId is required" }, { status: 400 })
  }

  const credential = await prisma.gmailCredential.findUnique({
    where: { id: credentialId },
  })

  // Authorize: the credential must belong to the caller's org. Never trust a
  // client-supplied id to target another org's mailbox.
  if (!credential || credential.organizationId !== organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Revoke the token with Google so it's no longer valid
  if (credential.refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: decrypt(credential.accessToken) })
      await oauth2Client.revokeCredentials()
    } catch {
      // Revoke can fail if token already expired — proceed with local cleanup anyway
    }
  }

  // Soft-delete: keep the row (so historical invoices retain their source
  // attribution and a later reconnect re-activates it) but zero the tokens and
  // sync state so it can't be used until reconnected.
  await prisma.gmailCredential.update({
    where: { id: credentialId },
    data: { connected: false, accessToken: "", refreshToken: "", syncToken: null },
  })

  return NextResponse.json({ success: true })
}
