"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MatchupCard } from "./matchup-card"
import { MvpToast } from "./mvp-toast"

const DIVISIONS = ["East", "North", "South", "West"]

interface GamesViewProps {
  week: number
  weekLabel: string
  onTeamClick?: (id: string) => void
}

export function GamesView({ week, weekLabel, onTeamClick }: GamesViewProps) {
  const [activeDivision, setActiveDivision] = useState("East")
  const division = `AFC ${activeDivision}`

  const { data: games, isLoading } = useQuery<object[]>({
    queryKey: ["games", week, division],
    queryFn: () =>
      fetch(`/api/games?week=${week}&division=${encodeURIComponent(division)}`).then(r => r.json()),
  })

  return (
    <div>
      {/* Weekly MVP banner */}
      <MvpToast week={week} />

      {/* Division tabs */}
      <div className="flex gap-1 mb-4 mt-2 border-b border-gray-800 overflow-x-auto">
        {DIVISIONS.map(div => (
          <button
            key={div}
            onClick={() => setActiveDivision(div)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              activeDivision === div
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            AFC {div}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-gray-500 text-sm py-8 text-center">Loading games…</div>
      )}

      {games?.map((game: any, i) => {
        const cardKey = `${week}-${division}-${i}`
        return (
          <MatchupCard
            key={cardKey}
            animationKey={cardKey}
            game={{ ...game, week_label: weekLabel }}
            onTeamClick={onTeamClick}
          />
        )
      })}
    </div>
  )
}
