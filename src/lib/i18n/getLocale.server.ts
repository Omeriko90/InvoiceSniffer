import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isValidLocale, type Locale } from "./config"

// Resolve the active locale for a server render. The cookie is the fast path the
// client keeps in sync on every switch; it's also what avoids a first-paint flash.
// (Step 2 adds a DB fallback here for users whose cookie is missing.)
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const cookieValue = store.get(LOCALE_COOKIE)?.value
  if (isValidLocale(cookieValue)) return cookieValue
  return DEFAULT_LOCALE
}
