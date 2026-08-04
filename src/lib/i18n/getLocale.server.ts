import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isValidLocale, type Locale } from "./config"

// Resolve the active locale for a server render. The cookie is the fast path the
// client keeps in sync on every switch; it's also what avoids a first-paint flash.
// When the cookie is absent (e.g. first load on a new device), fall back to the
// user's saved preference so their choice follows them across sessions.
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const cookieValue = store.get(LOCALE_COOKIE)?.value
  if (isValidLocale(cookieValue)) return cookieValue

  const session = await auth()
  if (isValidLocale(session?.user?.language)) return session.user.language

  return DEFAULT_LOCALE
}
