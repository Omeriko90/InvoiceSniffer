import { requirePrivileged } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { markIntegrationDisconnected } from "@/lib/integrations/credentials"
import { clampDirection } from "@/lib/integrations/types"
import { resolveProvider } from "../_shared"
import { NextRequest, NextResponse } from "next/server"

// Look up a credential and assert it belongs to the caller's org. Never trust a
// client-supplied id to target another org's integration.
async function loadOwnedCredential(credentialId: string, organizationId: string) {
  if (!credentialId) return null
  const cred = await prisma.integrationCredential.findUnique({ where: { id: credentialId } })
  if (!cred || cred.organizationId !== organizationId) return null
  return cred
}

// PATCH — update the connection's direction (PULL/PUSH/BOTH), clamped to the
// connector's capabilities.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { session, response } = await requirePrivileged()
  if (response) return response
  const { organizationId } = session.user

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider || !connectorImplemented(provider)) {
    return NextResponse.json({ error: "Unknown or unsupported provider" }, { status: 404 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    credentialId?: string
    direction?: string
  }
  const cred = await loadOwnedCredential(body.credentialId ?? "", organizationId)
  if (!cred) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!body.direction) {
    return NextResponse.json({ error: "direction is required" }, { status: 400 })
  }

  const direction = clampDirection(body.direction, getConnector(provider).capabilities)
  await prisma.integrationCredential.update({ where: { id: cred.id }, data: { direction } })
  return NextResponse.json({ success: true, direction })
}

// DELETE — soft-disconnect (clears secrets, keeps history so a later reconnect
// re-activates it). Mirrors the Gmail disconnect.
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { session, response } = await requirePrivileged()
  if (response) return response
  const { organizationId } = session.user

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as { credentialId?: string }
  const cred = await loadOwnedCredential(body.credentialId ?? "", organizationId)
  if (!cred) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await markIntegrationDisconnected(cred.id)
  return NextResponse.json({ success: true })
}
