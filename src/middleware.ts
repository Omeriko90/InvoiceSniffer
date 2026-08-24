import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthRoute = pathname.startsWith("/auth")
  const isApiRoute = pathname.startsWith("/api")
  // API endpoints that must work before/without an app session: NextAuth's own
  // handlers and the Gmail OAuth redirect. Everything else under /api requires a
  // session — see the default-deny below.
  const isPublicApi = pathname.startsWith("/api/auth") || pathname === "/api/gmail/callback"

  // Default-deny backstop: an unauthenticated request to any non-public API route
  // is rejected here, so a data route that ever forgets its own auth() check
  // isn't silently wide open. Routes still authenticate/authorize themselves —
  // this is defense in depth, not the primary control.
  if (!isLoggedIn && isApiRoute && !isPublicApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isLoggedIn && !isApiRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
