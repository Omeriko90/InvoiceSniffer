import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifySignature,
  verifyWebhookChallenge,
  getMediaUrl,
  downloadMedia,
  sendText,
  normalizeE164,
} from "@/lib/whatsapp"
import { putObject, whatsappMediaKey } from "@/lib/r2"
import { triggerWhatsAppIngest } from "@/lib/worker-trigger"
import { checkRateLimit } from "@/lib/rate-limit"
import { log } from "@/lib/posthog-server"

// Inbound webhook for the Meta WhatsApp Business Cloud API. PUBLIC (no app
// session) — see the isPublicApi allowlist in middleware.ts — so it is
// authenticated instead by the X-Hub-Signature-256 HMAC over the raw body.
//
// GET  = Meta's subscription verification handshake.
// POST = message notifications. We resolve the sender's phone to a verified
//        WhatsAppNumber (→ org), persist any media to R2, enqueue a PENDING
//        WhatsAppInboundMessage, and trigger the DB-driven ingest worker.

// Media message shapes we care about (image = photo of a receipt, document = PDF).
type MediaPayload = { id?: string; mime_type?: string; caption?: string; filename?: string }
type InboundMessage = {
  from?: string
  id?: string
  type?: string
  text?: { body?: string }
  image?: MediaPayload
  document?: MediaPayload
}
type WebhookBody = {
  entry?: { changes?: { value?: { messages?: InboundMessage[] } }[] }[]
}

const MIME_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function GET(req: NextRequest) {
  const challenge = verifyWebhookChallenge(req.nextUrl.searchParams)
  if (challenge === null) {
    return new NextResponse("Forbidden", { status: 403 })
  }
  // Meta expects the raw challenge echoed back as text/plain.
  return new NextResponse(challenge, { status: 200 })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-hub-signature-256")
  if (!verifySignature(raw, signature)) {
    return new NextResponse("Invalid signature", { status: 401 })
  }

  let body: WebhookBody
  try {
    body = JSON.parse(raw) as WebhookBody
  } catch {
    // Malformed but signed — ack so Meta doesn't retry a body we can't parse.
    return NextResponse.json({ received: true })
  }

  const messages: InboundMessage[] = []
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        messages.push(message)
      }
    }
  }

  let enqueued = 0
  for (const message of messages) {
    try {
      if (await handleMessage(message)) enqueued++
    } catch (err) {
      log.error("whatsapp-webhook: message handling failed", {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (enqueued > 0) {
    // Fire-and-forget: the PENDING rows are durable, so a trigger failure just
    // defers processing — it must not fail the webhook ack.
    void triggerWhatsAppIngest()
  }

  // Always 200 for a validly-signed request so Meta doesn't retry-storm.
  return NextResponse.json({ received: true })
}

// Returns true when an ingest row was enqueued (so the caller triggers a drain).
async function handleMessage(message: InboundMessage): Promise<boolean> {
  const fromRaw = message.from
  const wamid = message.id
  if (!fromRaw || !wamid) return false

  const phoneE164 = normalizeE164(fromRaw)
  if (!phoneE164) return false

  // Cheap abuse guard, keyed by sender. Fail-open (Redis down → allowed). When
  // over budget, silently drop rather than 4xx (which Meta would retry).
  const rl = await checkRateLimit(`whatsapp-inbound:${phoneE164}`, 30, 60_000)
  if (!rl.allowed) return false

  const number = await prisma.whatsAppNumber.findUnique({
    where: { phoneE164 },
    select: { id: true, organizationId: true, verified: true, verificationCode: true },
  })

  // Unknown sender: not linked to any org.
  if (!number) {
    await sendText(
      phoneE164,
      "This number isn't linked to an InvoiceSniffer account. Add it under Settings → WhatsApp to start sending invoices."
    )
    return false
  }

  // Pending verification: the sender proves ownership by texting their one-time code.
  if (!number.verified) {
    const text = message.text?.body?.trim()
    if (text && number.verificationCode && text === number.verificationCode) {
      await prisma.whatsAppNumber.update({
        where: { id: number.id },
        data: { verified: true, verifiedAt: new Date(), verificationCode: null },
      })
      await sendText(
        phoneE164,
        "✅ Your number is linked. Send an invoice as a PDF or photo and it'll show up in InvoiceSniffer."
      )
    } else {
      await sendText(
        phoneE164,
        "This number is pending verification. Send the code shown in InvoiceSniffer → Settings → WhatsApp to link it."
      )
    }
    return false
  }

  // Verified sender: only media (image/document) becomes an invoice.
  const media = message.image ?? message.document
  if (!media?.id) {
    await sendText(
      phoneE164,
      "📎 Please send your invoice as a PDF or a photo — I can't read a plain message."
    )
    return false
  }

  // Idempotent on Meta's wamid (webhooks are re-delivered).
  const already = await prisma.whatsAppInboundMessage.findUnique({
    where: { whatsappMessageId: wamid },
    select: { id: true },
  })
  if (already) return false

  // Resolve + download the media NOW — the media URL expires ~5 minutes after
  // delivery — and persist it to R2 so the worker can process it later.
  const resolved = await getMediaUrl(media.id)
  if (!resolved) {
    await sendText(phoneE164, "⚠️ I couldn't fetch that file from WhatsApp. Please try sending it again.")
    return false
  }
  const bytes = await downloadMedia(resolved.url)
  if (!bytes) {
    await sendText(phoneE164, "⚠️ I couldn't download that file from WhatsApp. Please try again.")
    return false
  }

  const mimeType = media.mime_type ?? resolved.mimeType
  const ext = MIME_EXT[mimeType] ?? "bin"
  const r2Key = whatsappMediaKey(number.organizationId, wamid, ext)
  await putObject(r2Key, bytes, mimeType)

  await prisma.whatsAppInboundMessage.create({
    data: {
      organizationId: number.organizationId,
      whatsappMessageId: wamid,
      fromPhoneE164: phoneE164,
      r2Key,
      mimeType,
      caption: media.caption ?? null,
    },
  })

  await sendText(phoneE164, "Got it — processing your invoice…")
  return true
}
