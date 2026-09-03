// POST /api/auth/login — verifies the submitted password against SITE_PASSWORD
// and sets a signed session cookie on success.

import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE, buildSessionCookieValue } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD
  const secret = process.env.AUTH_SECRET
  if (!sitePassword || !secret) {
    return NextResponse.json(
      { error: "Server misconfigured: SITE_PASSWORD or AUTH_SECRET not set" },
      { status: 500 },
    )
  }

  let password: string
  try {
    const body = await req.json()
    password = String(body?.password ?? "")
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (password !== sitePassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const cookieValue = await buildSessionCookieValue(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}
