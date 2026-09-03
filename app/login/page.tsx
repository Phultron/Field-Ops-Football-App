"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Login failed")
        setLoading(false)
        return
      }
      const from = searchParams.get("from") || "/"
      router.push(from)
      router.refresh()
    } catch {
      setError("Login failed — please try again")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 p-6"
      >
        <h1 className="text-lg font-bold text-white mb-1">Gridiron Fantasy Football</h1>
        <p className="text-xs text-gray-500 mb-5">Enter the site password to continue.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 mb-3"
        />

        {error && (
          <div className="text-xs text-red-400 mb-3">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 transition-colors"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
