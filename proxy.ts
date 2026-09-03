// Site-wide auth gate + IP rate limiting for all page and API routes.
// (Next.js 16 renamed the "middleware" file convention to "proxy" — this file
// replaces the old middleware.ts. See https://nextjs.org/docs/messages/middleware-to-proxy)
//
// Auth: a single shared SITE_PASSWORD gates the whole app. On successful login
// (see app/api/auth/login/route.ts) we set a signed cookie: `value.signature`,
// where signature = HMAC-SHA256(AUTH_SECRET, value) using Web Crypto. Proxy
// verifies that signature on every request.
//
// Rate limiting: Upstash Redis, keyed by request IP, applied to /api/* only.
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars — see
// .env.example. If those aren't set (e.g. local dev), rate limiting is skipped.

import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { AUTH_COOKIE, isValidSession } from "@/lib/auth"

// --- Rate limiter (lazily created, shared across warm invocations) ---

let ratelimit: Ratelimit | null | undefined

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    ratelimit = null
    return null
  }
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, "10 s"),
    prefix: "gridiron-fantasy",
  })
  return ratelimit
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApiRoute = pathname.startsWith("/api/")
  const isAuthRoute = pathname.startsWith("/api/auth/") || pathname === "/login"

  // --- 1. Rate limiting (API routes only, skip auth routes to avoid locking out login) ---
  if (isApiRoute && !isAuthRoute) {
    const limiter = getRatelimit()
    if (limiter) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
      const { success } = await limiter.limit(ip)
      if (!success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 })
      }
    }
  }

  // --- 2. Auth gate ---
  if (isAuthRoute) {
    return NextResponse.next()
  }

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    // Misconfigured deployment — fail closed rather than silently open.
    return isApiRoute
      ? NextResponse.json({ error: "Server misconfigured: AUTH_SECRET not set" }, { status: 500 })
      : new NextResponse("Server misconfigured: AUTH_SECRET not set", { status: 500 })
  }

  const authed = await isValidSession(req.cookies.get(AUTH_COOKIE)?.value, secret)
  if (authed) {
    return NextResponse.next()
  }

  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", req.url)
  loginUrl.searchParams.set("from", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, icon.svg, and other public static files
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
}
