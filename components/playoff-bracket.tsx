"use client"
import { useQuery } from "@tanstack/react-query"
import { TeamLogo } from "./team-logo"
import { Trophy } from "lucide-react"

interface PlayoffTeam {
  employee_id: string
  mascot: string
  manager: string
  division: string
  reg_wins: number
  seed: number
}

interface PlayoffMatchup {
  team_a: PlayoffTeam
  team_b: PlayoffTeam
  score_a: number
  score_b: number
  winner: "A" | "B" | null
  week: number
}

interface PlayoffData {
  semis: PlayoffMatchup[]
  championship: PlayoffMatchup
  champion: PlayoffTeam
}

function MatchupRow({ matchup, onTeamClick }: {
  matchup: PlayoffMatchup
  onTeamClick?: (id: string) => void
}) {
  const winA = matchup.winner === "A"
  const winB = matchup.winner === "B"
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
      {[
        { team: matchup.team_a, score: matchup.score_a, isWinner: winA },
        { team: matchup.team_b, score: matchup.score_b, isWinner: winB },
      ].map(({ team, score, isWinner }, i) => (
        <div
          key={team.employee_id}
          className={`flex items-center gap-2 px-3 py-2 ${i === 0 ? "border-b border-gray-800" : ""} ${isWinner ? "bg-green-950/40" : ""}`}
        >
          <button
            onClick={() => onTeamClick?.(team.employee_id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <TeamLogo employeeId={team.employee_id} size={22} />
            <div className="min-w-0">
              <div className={`text-xs font-bold truncate ${isWinner ? "text-green-300" : "text-gray-300"}`}>{team.mascot}</div>
              <div className="text-[9px] text-gray-600">{team.division.split(" ")[1]} · {team.reg_wins}W reg</div>
            </div>
          </button>
          <div className={`text-base font-black w-8 text-right ${isWinner ? "text-green-400" : "text-gray-500"}`}>
            {score}
          </div>
          {isWinner && <Trophy size={12} className="text-yellow-400 shrink-0" />}
        </div>
      ))}
    </div>
  )
}

export function PlayoffBracket({ onTeamClick }: { onTeamClick?: (id: string) => void }) {
  const { data, isLoading } = useQuery<PlayoffData>({
    queryKey: ["playoffs"],
    queryFn: () => fetch("/api/playoffs").then(r => r.json()),
  })

  if (isLoading || !data) return (
    <div className="text-gray-500 text-sm py-12 text-center">Loading bracket…</div>
  )

  return (
    <div className="mt-4 space-y-6 max-w-lg mx-auto">
      {/* Semi-finals */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-3">Week 8 · Semi-finals</div>
        <div className="space-y-2">
          {data.semis.map((m, i) => (
            <MatchupRow key={i} matchup={m} onTeamClick={onTeamClick} />
          ))}
        </div>
      </div>

      {/* Championship */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-3">Week 9 · Championship</div>
        <MatchupRow matchup={data.championship} onTeamClick={onTeamClick} />
      </div>

      {/* Champion */}
      <div className="rounded-xl border border-yellow-600/60 bg-yellow-900/20 px-4 py-4 text-center">
        <div className="text-2xl mb-1">🏆</div>
        <div className="text-[10px] uppercase tracking-widest text-yellow-600 mb-1">Field Ops Fantasy Football Champion</div>
        <div className="text-xl font-black text-yellow-300">{data.champion.mascot}</div>
        <div className="text-xs text-yellow-600 mt-0.5">{data.champion.manager}</div>
        <div className="text-[10px] text-yellow-700 mt-1">{data.champion.division}</div>
      </div>
    </div>
  )
}
