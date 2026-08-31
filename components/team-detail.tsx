"use client"
import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { TeamLogo } from "./team-logo"
import { X, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react"

interface TeamDetailProps {
  teamId: string | null
  week: number
  onClose: () => void
}

export function TeamDetail({ teamId, week, onClose }: TeamDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const open = !!teamId

  const { data, isLoading } = useQuery<any>({
    queryKey: ["team", teamId, week],
    queryFn: () => fetch(`/api/team?id=${teamId}&throughWeek=${week}`).then(r => r.json()),
    enabled: !!teamId,
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Trap focus
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s" }}
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-gray-950 border-l border-gray-800 overflow-y-auto outline-none"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between z-10">
          <span className="text-sm font-bold text-gray-200">Team Profile</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {(isLoading || !data) ? (
          <div className="px-4 py-12 text-center text-gray-500 text-sm">Loading…</div>
        ) : (
          <div className="px-4 py-5 space-y-6">
            {/* Team identity */}
            <div className="flex items-center gap-4">
              <TeamLogo employeeId={data.team.employee_id} size={64} />
              <div>
                <div className="text-xl font-black text-white">{data.team.mascot}</div>
                <div className="text-sm text-gray-400 italic">{data.team.manager_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{data.team.district} · {data.team.division}</div>
              </div>
            </div>

            {/* Record */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Wins",   val: data.wins,   color: "text-green-400" },
                { label: "Losses", val: data.losses, color: "text-red-400" },
                { label: "Ties",   val: data.ties,   color: "text-gray-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg py-3">
                  <div className={`text-3xl font-black ${color}`}>{val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Week-by-week performance */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Week-by-Week</div>
              <div className="space-y-1.5">
                {data.weeklyScores.map((ws: any) => {
                  const Icon = ws.win === true ? TrendingUp : ws.win === false ? TrendingDown : Minus
                  const iconColor = ws.win === true ? "text-green-400" : ws.win === false ? "text-red-400" : "text-gray-500"
                  const barMax = 100
                  const barPct = ws.composite_score
                  return (
                    <div key={ws.week} className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-500 w-12 shrink-0">{ws.label}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${barPct}%`, transition: "width 0.5s ease" }} />
                      </div>
                      <div className="text-[10px] text-gray-400 w-12 text-right shrink-0">{ws.total_yards.toLocaleString()}</div>
                      <Icon size={12} className={`${iconColor} shrink-0`} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Upcoming */}
            {data.upcoming.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar size={12} /> Upcoming
                </div>
                <div className="space-y-2">
                  {data.upcoming.map((u: any) => (
                    <div key={u.week} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">{u.label}</div>
                      {u.opponent ? (
                        <div className="flex items-center gap-2">
                          <TeamLogo employeeId={u.opponent.employee_id} size={20} />
                          <div className="text-xs text-gray-300">{u.opponent.mascot}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">BYE</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team stats */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Season Averages</div>
              {data.weeklyScores.length > 0 && (() => {
                const avg = (arr: number[]) => Math.round(arr.reduce((s: number, v: number) => s + v, 0) / arr.length)
                const ws = data.weeklyScores
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Referrals / wk",  val: avg(ws.map((w: any) => w.referrals)) },
                      { label: "Upsell % / wk",   val: avg(ws.map((w: any) => w.upsell_pct)) },
                      { label: "VPP / wk",         val: avg(ws.map((w: any) => w.vpp)) },
                      { label: "Score / wk",       val: avg(ws.map((w: any) => w.composite_score)) },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                        <div className="text-base font-bold text-gray-200">{val}</div>
                        <div className="text-[10px] text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
