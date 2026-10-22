import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isValidLocale, LOCALE_COOKIE } from "@/lib/i18n/config"
import { NextResponse } from "next/server"

// PATCH /api/user/language — set the signed-in user's UI language.
// Per-user preference (any authenticated member), NOT an org-level/privileged
// setting, so it deliberately does not go through requirePrivileged().
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { language?: unknown }
  if (!isValidLocale(body.language)) {
    return NextResponse.json({ error: "language must be one of: en, he" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { language: body.language },
  })

  // Mirror to the cookie so the very next SSR render uses the new language.
  const res = NextResponse.json({ language: body.language })
  res.cookies.set(LOCALE_COOKIE, body.language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return res
}
