// Shared auth-cookie helpers used by both middleware.ts and the auth API routes.
// Uses Web Crypto (crypto.subtle) so it works on both the Edge and Node.js runtimes.

export const AUTH_COOKIE = "gf_session"
export const SESSION_VALUE = "authenticated"

export async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return Buffer.from(sig).toString("hex")
}

export async function isValidSession(cookieValue: string | undefined, secret: string): Promise<boolean> {
  if (!cookieValue) return false
  const [value, signature] = cookieValue.split(".")
  if (!value || !signature || value !== SESSION_VALUE) return false
  const expected = await hmac(secret, value)
  return signature === expected
}

/** Builds the signed cookie value to set after a successful login. */
export async function buildSessionCookieValue(secret: string): Promise<string> {
  const signature = await hmac(secret, SESSION_VALUE)
  return `${SESSION_VALUE}.${signature}`
}
