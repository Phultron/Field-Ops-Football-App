"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GamesView } from "@/components/games-view"
import { StandingsPanel } from "@/components/standings-panel"
import { SchedulePanel } from "@/components/schedule-panel"
import { AwardsPanel } from "@/components/awards-panel"
import { AuditPanel } from "@/components/audit-panel"
import { PlayoffBracket } from "@/components/playoff-bracket"
import { TeamDetail } from "@/components/team-detail"
import { SEASON_WEEKS } from "@/lib/demo"
import { COMPETITION_START } from "@/lib/config"
import { LogoMapProvider } from "@/lib/logo-context"
import type { TeamLogo } from "@/lib/teams"

// Auto-detect the current round: floor(days since start / 7) + 1, clamped to completed rounds
function getCurrentRound(): number {
  const start = new Date(COMPETITION_START + "T00:00:00Z")
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince < 0) return 1
  return Math.min(SEASON_WEEKS.length, Math.max(1, Math.floor(daysSince / 7) + 1))
}

const TABS = ["This Week's Games", "Standings", "Schedule", "Awards", "Playoffs", "Audit"] as const
type Tab = typeof TABS[number]

const TAB_ICONS: Record<Tab, string> = {
  "This Week's Games": "🏟️",
  "Standings": "📊",
  "Schedule": "📅",
  "Awards": "🏆",
  "Playoffs": "🥇",
  "Audit": "🔍",
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("This Week's Games")
  const [week, setWeek] = useState(getCurrentRound)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const { data: rosterData } = useQuery<{ logoMap: Record<string, TeamLogo> }>({
    queryKey: ["roster"],
    queryFn: () => fetch("/api/roster").then(r => r.json()),
    staleTime: 60_000,
  })

  const weekLabel = SEASON_WEEKS[week - 1]?.label ?? `Week ${week}`
  const weekStart = SEASON_WEEKS[week - 1]?.start
  const weekEnd   = SEASON_WEEKS[week - 1]?.end
  const weekRange = weekStart && weekEnd
    ? `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : ""

  return (
    <LogoMapProvider logoMap={rosterData?.logoMap ?? null}>
      {/* Team detail slide-out */}
      <TeamDetail
        teamId={selectedTeamId}
        week={week}
        onClose={() => setSelectedTeamId(null)}
      />

      <main className="min-h-screen bg-[#0d1117] text-gray-100">
        {/* App header */}
        <header className="border-b border-gray-800 bg-[#0d1117] sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <ellipse cx="20" cy="20" rx="17" ry="11" fill="#c46e00" />
                <line x1="20" y1="9" x2="20" y2="31" stroke="white" strokeWidth="1.5" />
                <line x1="14" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" />
                <line x1="13" y1="20" x2="27" y2="20" stroke="white" strokeWidth="1.5" />
                <line x1="14" y1="24" x2="26" y2="24" stroke="white" strokeWidth="1.5" />
              </svg>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-white leading-tight truncate">Field Ops Fantasy Football</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 leading-tight hidden xs:block">2026 Season · Field Service Team Competition</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-gray-500 hidden sm:block">Week</span>
              <select
                value={week}
                onChange={e => setWeek(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
              >
                {SEASON_WEEKS.map((_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
          {/* Page title */}
          <h1 className="text-xl sm:text-2xl font-black text-white mb-1">Field Ops Fantasy Football</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">2026 Season · Field Service Team Competition</p>

          {/* Main tabs */}
          <div className="flex gap-0.5 border-b border-gray-800 mb-4 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {TAB_ICONS[tab]} {tab}
              </button>
            ))}
          </div>

          {/* Week heading (games tab only) */}
          {activeTab === "This Week's Games" && (
            <div className="mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-100">
                {weekLabel} <span className="text-xs sm:text-sm font-normal text-gray-500">{weekRange}</span>
              </h2>
            </div>
          )}

          {/* Tab content */}
          {activeTab === "This Week's Games" && (
            <GamesView week={week} weekLabel={weekLabel} onTeamClick={setSelectedTeamId} />
          )}
          {activeTab === "Standings" && (
            <StandingsPanel week={week} onTeamClick={setSelectedTeamId} />
          )}
          {activeTab === "Schedule" && (
            <SchedulePanel currentWeek={week} />
          )}
          {activeTab === "Awards" && (
            <AwardsPanel week={week} />
          )}
          {activeTab === "Playoffs" && (
            <PlayoffBracket onTeamClick={setSelectedTeamId} />
          )}
          {activeTab === "Audit" && (
            <AuditPanel week={week} onTeamClick={setSelectedTeamId} />
          )}
        </div>
      </main>
    </LogoMapProvider>
  )
}
