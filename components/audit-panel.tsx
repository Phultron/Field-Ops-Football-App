"use client"
import { useQuery } from "@tanstack/react-query"
import { TeamLogo } from "./team-logo"

interface AuditRow {
  team_id: string
  mascot: string
  manager: string
  district: string
  seed: number
  division: string
  referrals: number
  upsell_pct: number
  vpp: number
  composite_score: number
  active_days: number
}

export function AuditPanel({ week, onTeamClick }: {
  week: number
  onTeamClick?: (id: string) => void
}) {
  const { data, isLoading } = useQuery<Record<string, AuditRow[]>>({
    queryKey: ["audit", week],
    queryFn: () => fetch(`/api/audit?conference=AFC&week=${week}`).then(r => r.json()),
  })

  if (isLoading || !data) return (
    <div className="text-gray-500 text-sm py-8 text-center">Loading audit data…</div>
  )

  const divisions = Object.entries(data)

  return (
    <div className="space-y-6 mt-4">
      <div className="text-[11px] text-gray-500 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
        Raw daily-average metrics that build each team&apos;s composite score.
        Composite = Referrals×40% + Upsell %×40% + VPP×20%.
      </div>

      {divisions.map(([divKey, teams]) => (
        <div key={divKey} className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
          <div className="bg-gray-900 px-4 py-2 font-bold text-gray-200 text-sm border-b border-gray-700">
            {divKey}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-right py-2 px-2">Referrals<div className="text-[8px] font-normal">40% wt</div></th>
                  <th className="text-right py-2 px-2">Upsell %<div className="text-[8px] font-normal">40% wt</div></th>
                  <th className="text-right py-2 px-2">VPP<div className="text-[8px] font-normal">20% wt</div></th>
                  <th className="text-right py-2 px-3">Composite</th>
                  <th className="text-right py-2 px-2">Active Days</th>
                </tr>
              </thead>
              <tbody>
                {[...teams].sort((a, b) => b.composite_score - a.composite_score).map((t, i) => (
                  <tr key={t.team_id} className={`border-b border-gray-800 ${i === 0 ? "bg-gray-900/40" : ""}`}>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onTeamClick?.(t.team_id)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left w-full"
                      >
                        <TeamLogo employeeId={t.team_id} size={22} />
                        <div>
                          <div className="text-gray-200 font-medium truncate max-w-[130px]">{t.mascot}</div>
                          <div className="text-gray-500 text-[10px]">{t.manager}</div>
                        </div>
                      </button>
                    </td>
                    <td className="text-right py-2 px-2 text-gray-300 font-mono">{t.referrals}</td>
                    <td className="text-right py-2 px-2 text-gray-300 font-mono">{t.upsell_pct}</td>
                    <td className="text-right py-2 px-2 text-gray-300 font-mono">{t.vpp}</td>
                    <td className="text-right py-2 px-3 text-gray-100 font-mono font-bold">{t.composite_score}</td>
                    <td className="text-right py-2 px-2 text-gray-500">{t.active_days}/4</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
