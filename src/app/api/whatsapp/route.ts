import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import { prisma } from "@/lib/prisma"
import { requirePrivileged } from "@/lib/authz"
import { maxWhatsAppNumbers } from "@/lib/plan-limits"
import { normalizeE164, whatsappBusinessNumber } from "@/lib/whatsapp"
import type { WhatsAppNumberInfo } from "@/api-types/settings"

function toInfo(n: {
  id: string
  phoneE164: string
  verified: boolean
  createdAt: Date
}): WhatsAppNumberInfo {
  return {
    id: n.id,
    phoneE164: n.phoneE164,
    verified: n.verified,
    createdAt: n.createdAt.toISOString(),
  }
}

// A 6-digit numeric code, prefixed so it reads clearly in a chat.
function generateCode(): string {
  return `IS-${randomInt(0, 1_000_000).toString().padStart(6, "0")}`
}

function waLinkFor(code: string): string | null {
  const business = whatsappBusinessNumber()
  return business ? `https://wa.me/${business}?text=${encodeURIComponent(code)}` : null
}

// POST { phone } — register a phone number for this org. Creates (or refreshes)
// an unverified WhatsAppNumber with a one-time code; the number flips to verified
// when that code arrives via WhatsApp from it (see the webhook).
export async function POST(request: Request) {
  const { session, response } = await requirePrivileged()
  if (response) return response
  const { organizationId } = session.user

  const body = (await request.json().catch(() => ({}))) as { phone?: unknown }
  if (typeof body.phone !== "string") {
    return NextResponse.json({ error: "phone is required" }, { status: 400 })
  }
  const phoneE164 = normalizeE164(body.phone)
  if (!phoneE164) {
    return NextResponse.json({ error: "Enter a valid phone number with country code" }, { status: 400 })
  }

  const existing = await prisma.whatsAppNumber.findUnique({ where: { phoneE164 } })
  if (existing && existing.organizationId !== organizationId) {
    return NextResponse.json(
      { error: "That number is already linked to another account." },
      { status: 409 }
    )
  }

  // Plan cap: count numbers already held by the org (excluding this phone if it's
  // a re-registration). A new phone can't be added once the cap is reached.
  if (!existing) {
    const [org, count] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { planTier: true },
      }),
      prisma.whatsAppNumber.count({ where: { organizationId } }),
    ])
    if (org && count >= maxWhatsAppNumbers(org.planTier)) {
      return NextResponse.json(
        { error: `Your plan allows up to ${maxWhatsAppNumbers(org.planTier)} WhatsApp number(s).` },
        { status: 402 }
      )
    }
  }

  const verificationCode = generateCode()
  const number = existing
    ? await prisma.whatsAppNumber.update({
        where: { id: existing.id },
        // Re-issue a code; leave an already-verified number verified.
        data: existing.verified ? {} : { verificationCode },
      })
    : await prisma.whatsAppNumber.create({
        data: { organizationId, phoneE164, verificationCode },
      })

  return NextResponse.json({
    number: toInfo(number),
    verificationCode: number.verified ? "" : verificationCode,
    waLink: number.verified ? null : waLinkFor(verificationCode),
  })
}

// DELETE { id } — unlink a number from this org.
export async function DELETE(request: Request) {
  const { session, response } = await requirePrivileged()
  if (response) return response
  const { organizationId } = session.user

  const body = (await request.json().catch(() => ({}))) as { id?: unknown }
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  // Scope the delete to the org so an id from another tenant can't be removed.
  await prisma.whatsAppNumber.deleteMany({ where: { id: body.id, organizationId } })
  return NextResponse.json({ success: true })
}
