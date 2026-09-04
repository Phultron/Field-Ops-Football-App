"use client"
import { useQuery } from "@tanstack/react-query"

interface MatchupResult {
  a: string
  b: string
  a_mascot: string
  b_mascot: string
  score_a?: number
  score_b?: number
  winner?: "A" | "B" | "T"
  is_past: boolean
}

interface ScheduleWeek {
  week: number
  label: string
  date_range: string
  matchups: MatchupResult[]
}

export function SchedulePanel({ currentWeek }: { currentWeek: number }) {
  const { data, isLoading } = useQuery<Record<string, ScheduleWeek[]>>({
    queryKey: ["schedule", currentWeek],
    queryFn: () => fetch(`/api/schedule?conference=Conf&throughWeek=${currentWeek}`).then(r => r.json()),
  })

  if (isLoading || !data) return (
    <div className="text-gray-500 text-sm py-8 text-center">Loading schedule…</div>
  )

  const divisions = Object.entries(data)

  return (
    <div className="space-y-6 mt-4">
      {divisions.map(([divKey, weeks]) => (
        <div key={divKey} className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
          <div className="bg-gray-900 px-4 py-2 font-bold text-gray-200 text-sm border-b border-gray-700">
            {divKey}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  {weeks.map(w => (
                    <th key={w.week} className={`text-center py-2 px-3 min-w-[130px] ${w.week <= currentWeek ? "text-gray-400" : ""}`}>
                      <div>{w.label}</div>
                      <div className="text-[9px] font-normal text-gray-600 mt-0.5">{w.date_range}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map(matchIdx => (
                  <tr key={matchIdx} className="border-b border-gray-800">
                    {weeks.map(w => {
                      const m = w.matchups[matchIdx]
                      if (!m) return <td key={w.week} className="py-2 px-3" />

                      const winnerA = m.is_past && m.winner === "A"
                      const winnerB = m.is_past && m.winner === "B"
                      const showScore = m.is_past && m.score_a !== undefined && m.score_b !== undefined
                      const hasTDs = showScore && (m.score_a! > 0 || m.score_b! > 0)

                      return (
                        <td key={w.week} className={`py-2 px-3 text-center ${m.is_past ? "bg-gray-900/30" : ""}`}>
                          <div className={`font-medium truncate ${winnerA ? "text-green-400" : "text-gray-300"}`}>
                            {m.a_mascot}
                          </div>
                          {showScore ? (
                            hasTDs ? (
                              <div className="text-[10px] font-bold my-0.5">
                                <span className={winnerA ? "text-green-400" : "text-gray-500"}>{m.score_a}</span>
                                <span className="text-gray-600 mx-1">–</span>
                                <span className={winnerB ? "text-green-400" : "text-gray-500"}>{m.score_b}</span>
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold my-0.5 text-gray-500">
                                {winnerA ? "W–L" : winnerB ? "L–W" : "T"}
                              </div>
                            )
                          ) : (
                            <div className="text-gray-600 text-[9px] my-0.5">vs</div>
                          )}
                          <div className={`truncate ${winnerB ? "text-green-400" : "text-gray-400"}`}>
                            {m.b_mascot}
                          </div>
                        </td>
                      )
                    })}
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
