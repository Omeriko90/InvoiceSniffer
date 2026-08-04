import { requireSession } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { directionAllowsPush } from "@/lib/integrations/types"
import { integrationPushQueue, type IntegrationPushJobData } from "@/lib/queues"
import { resolveProvider } from "../../_shared"
import { NextRequest, NextResponse } from "next/server"

// POST — enqueue a push of the given invoices to a connected integration. Any
// signed-in member may trigger a sync (it's data work, not org reconfiguration).
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { session, response } = await requireSession()
  if (response) return response
  const { organizationId } = session.user

  const provider = resolveProvider((await ctx.params).provider)
  if (!provider || !connectorImplemented(provider)) {
    return NextResponse.json({ error: "Unknown or unsupported provider" }, { status: 404 })
  }
  const connector = getConnector(provider)
  if (!connector.capabilities.canPush) {
    return NextResponse.json({ error: "This provider does not support export" }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    credentialId?: string
    invoiceIds?: string[]
  }
  const invoiceIds = (body.invoiceIds ?? []).filter((id) => typeof id === "string")
  if (invoiceIds.length === 0) {
    return NextResponse.json({ error: "invoiceIds is required" }, { status: 400 })
  }

  // Resolve the target connection: an explicit credentialId (scoped to the org),
  // else the org's connected, push-enabled account for this provider.
  const cred = body.credentialId
    ? await prisma.integrationCredential.findFirst({
        where: { id: body.credentialId, organizationId, provider },
      })
    : await prisma.integrationCredential.findFirst({
        where: { organizationId, provider, connected: true },
        orderBy: { createdAt: "asc" },
      })
  if (!cred || !cred.connected) {
    return NextResponse.json({ error: "No connected integration to sync to" }, { status: 404 })
  }
  if (!directionAllowsPush(cred.direction)) {
    return NextResponse.json({ error: "Export is disabled for this connection" }, { status: 400 })
  }

  await integrationPushQueue().add("push", {
    organizationId,
    integrationCredentialId: cred.id,
    invoiceIds,
  } satisfies IntegrationPushJobData)

  return NextResponse.json({ success: true, queued: invoiceIds.length })
}
