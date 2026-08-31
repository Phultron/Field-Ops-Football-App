"use client"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Trophy } from "lucide-react"
import { TeamLogo } from "./team-logo"

export function MvpToast({ week }: { week: number }) {
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  const { data } = useQuery<any>({
    queryKey: ["awards", week],
    queryFn: () => fetch(`/api/awards?week=${week}`).then(r => r.json()),
  })

  // Reset visibility when week changes
  useEffect(() => {
    setVisible(true)
    setMounted(false)
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [week])

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [week, visible])

  if (!visible || !data?.heisman) return null

  return (
    <div
      className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 mb-4 flex items-center gap-3"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <Trophy size={18} className="text-yellow-400 shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamLogo employeeId={data.heisman.team_id} size={28} />
        <span className="text-sm text-gray-200 truncate">
          <span className="text-yellow-400 font-bold">Week {week} MVP:</span>{" "}
          {data.heisman.mascot}
          <span className="text-gray-500 text-[11px] ml-1">({data.heisman.yards} pts · {data.heisman.manager})</span>
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-500 hover:text-gray-300 text-lg leading-none shrink-0"
        aria-label="Dismiss"
      >✕</button>
    </div>
  )
}
