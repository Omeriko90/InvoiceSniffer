import crypto from "crypto"
import { log } from "@/lib/posthog-server"

// Thin client over the Meta WhatsApp Business Cloud API (Graph API). The app
// owns ONE business number (WHATSAPP_PHONE_NUMBER_ID); users register their own
// phone in Settings and message that number. Inbound media arrives via webhook
// as a media id, which we resolve to a short-lived (~5 min) download URL.

const GRAPH_API_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

function accessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN ?? null
}

function phoneNumberId(): string | null {
  return process.env.WHATSAPP_PHONE_NUMBER_ID ?? null
}

// True when the inbound path is configured enough to accept + process webhooks.
export function whatsappEnabled(): boolean {
  return Boolean(accessToken() && phoneNumberId() && process.env.WHATSAPP_APP_SECRET)
}

const WHATSAPP_VARS = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_BUSINESS_NUMBER",
] as const

// Warn (never throw) about a half-configured WhatsApp integration at startup:
// the feature is optional, so all-unset is fine (silently off), but some-set is
// almost certainly a mistake that would fail webhook verification or media
// fetches at runtime. Called from instrumentation.register().
export function warnWhatsAppConfig(): void {
  const set = WHATSAPP_VARS.filter((v) => process.env[v])
  if (set.length === 0 || set.length === WHATSAPP_VARS.length) return
  const missing = WHATSAPP_VARS.filter((v) => !process.env[v])
  log.warn(
    `whatsapp: partially configured — missing ${missing.join(", ")}. ` +
      "Inbound WhatsApp invoices will not work until all WHATSAPP_* vars are set."
  )
}

// The business number in wa.me / display form (digits only, no +), used to build
// the click-to-chat link a user taps to send their verification code.
export function whatsappBusinessNumber(): string | null {
  const raw = process.env.WHATSAPP_BUSINESS_NUMBER
  return raw ? raw.replace(/[^\d]/g, "") : null
}

// Verify Meta's X-Hub-Signature-256 over the RAW request body using the app
// secret. Constant-time compare; any shape/config problem fails closed.
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !signatureHeader) return false
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// The GET webhook-verification handshake: echo hub.challenge iff the caller
// presents the token we configured. Returns the challenge string or null.
export function verifyWebhookChallenge(params: URLSearchParams): string | null {
  const mode = params.get("hub.mode")
  const token = params.get("hub.verify_token")
  const challenge = params.get("hub.challenge")
  const expected = process.env.WHATSAPP_VERIFY_TOKEN
  if (mode === "subscribe" && expected && token === expected) return challenge
  return null
}

// Normalize a phone number to E.164 (+<countrycode><number>). Meta delivers the
// sender as bare digits (no +), and users type numbers with spaces/dashes/(0);
// both must resolve to the same stored key. Returns null if implausible.
export function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "")
  // E.164 allows up to 15 digits; require at least 8 to reject junk.
  if (digits.length < 8 || digits.length > 15) return null
  return `+${digits}`
}

export type WhatsAppMedia = { url: string; mimeType: string }

// Resolve a media id to its (short-lived) download URL + mime type.
export async function getMediaUrl(mediaId: string): Promise<WhatsAppMedia | null> {
  const token = accessToken()
  if (!token) return null
  try {
    const res = await fetch(`${GRAPH_BASE}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      log.warn("whatsapp: getMediaUrl failed", { mediaId, status: res.status })
      return null
    }
    const data = (await res.json()) as { url?: string; mime_type?: string }
    if (!data.url) return null
    return { url: data.url, mimeType: data.mime_type ?? "application/octet-stream" }
  } catch (err) {
    log.warn("whatsapp: getMediaUrl error", { mediaId, err: String(err) })
    return null
  }
}

// Download the media bytes. The lookaside URL still requires the bearer token.
export async function downloadMedia(url: string): Promise<Buffer | null> {
  const token = accessToken()
  if (!token) return null
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      log.warn("whatsapp: downloadMedia failed", { status: res.status })
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    log.warn("whatsapp: downloadMedia error", { err: String(err) })
    return null
  }
}

// Send a free-form text reply. Valid only inside the 24h customer-service window
// (which an inbound message opens), so no message template is required. Best
// effort — a failed reply must never fail ingestion.
export async function sendText(toPhoneE164: string, body: string): Promise<void> {
  const token = accessToken()
  const from = phoneNumberId()
  if (!token || !from) return
  try {
    const res = await fetch(`${GRAPH_BASE}/${from}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhoneE164.replace(/[^\d]/g, ""),
        type: "text",
        text: { body },
      }),
    })
    if (!res.ok) {
      log.warn("whatsapp: sendText failed", { status: res.status })
    }
  } catch (err) {
    log.warn("whatsapp: sendText error", { err: String(err) })
  }
}
