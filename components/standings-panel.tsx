"use client"
import { useQuery } from "@tanstack/react-query"
import { TeamLogo } from "./team-logo"

interface Standing {
  team_id: string
  mascot: string
  manager: string
  district: string
  seed: number
  wins: number
  losses: number
  ties: number
  total_yards: number
  division: string
}

function PlayoffBadge({ wins, divLeaderWins, week }: { wins: number; divLeaderWins: number; week: number }) {
  if (week < 4) return null
  const gamesBack = divLeaderWins - wins
  const weeksLeft = Math.max(0, 6 - week) // regular season ends week 6

  if (gamesBack === 0)            return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-900 text-green-300">IN</span>
  if (gamesBack === 1)            return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-300">BUBBLE</span>
  if (gamesBack >= 2 && weeksLeft <= 3) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400">OUT</span>
  return null
}

export function StandingsPanel({ week, onTeamClick }: {
  week: number
  onTeamClick?: (id: string) => void
}) {
  const { data, isLoading } = useQuery<Record<string, Standing[]>>({
    queryKey: ["standings", week],
    queryFn: () => fetch(`/api/standings?conference=AFC&throughWeek=${week}`).then(r => r.json()),
  })

  if (isLoading || !data) return (
    <div className="text-gray-500 text-sm py-8 text-center">Loading standings…</div>
  )

  const divisions = Object.entries(data)

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      {divisions.map(([divKey, teams]) => {
        const leaderWins = teams[0]?.wins ?? 0
        return (
          <div key={divKey} className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 font-bold text-gray-200 text-sm border-b border-gray-700">
              {divKey}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-center py-2 px-2">W</th>
                  <th className="text-center py-2 px-2">L</th>
                  <th className="text-center py-2 px-2">T</th>
                  <th className="text-right py-2 px-3">Score</th>
                  {week >= 4 && <th className="text-right py-2 px-2" title="Playoff picture" />}
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.team_id} className={`border-b border-gray-800 ${i === 0 ? "bg-gray-900/40" : ""}`}>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onTeamClick?.(t.team_id)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left w-full"
                      >
                        <TeamLogo employeeId={t.team_id} size={24} />
                        <div>
                          <div className="text-gray-200 font-medium truncate max-w-[120px]">{t.mascot}</div>
                          <div className="text-gray-500 text-[10px]">{t.manager}</div>
                        </div>
                      </button>
                    </td>
                    <td className="text-center py-2 px-2 text-gray-200 font-bold">{t.wins}</td>
                    <td className="text-center py-2 px-2 text-gray-400">{t.losses}</td>
                    <td className="text-center py-2 px-2 text-gray-500">{t.ties}</td>
                    <td className="text-right py-2 px-3 text-gray-400">{t.composite_score}</td>
                    {week >= 4 && (
                      <td className="text-right py-2 px-2">
                        <PlayoffBadge wins={t.wins} divLeaderWins={leaderWins} week={week} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
