import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const credential = await prisma.gmailCredential.findUnique({
    where: { organizationId },
  })

  if (credential) {
    // Revoke the token with Google so it's no longer valid
    try {
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: decrypt(credential.accessToken) })
      await oauth2Client.revokeCredentials()
    } catch {
      // Revoke can fail if token already expired — proceed with local cleanup anyway
    }

    await prisma.gmailCredential.delete({ where: { organizationId } })
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { gmailConnected: false, gmailSyncToken: null },
  })

  return NextResponse.json({ success: true })
}
