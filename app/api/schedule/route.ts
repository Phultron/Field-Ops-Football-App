// GET /api/schedule?conference=AFC&throughWeek=3
import { NextRequest } from "next/server"
import { TEAMS, DIVISIONS, getWeekMatchups } from "@/lib/teams"
import { SEASON_WEEKS, simulateWeeklyDrive, DEMO_DAYS } from "@/lib/demo"
import { fetchMultiWeekScores, getWeekDates } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const conference = req.nextUrl.searchParams.get("conference") ?? "AFC"
  const throughWeek = Math.min(
    SEASON_WEEKS.length,
    Math.max(0, parseInt(req.nextUrl.searchParams.get("throughWeek") ?? "0", 10))
  )

  // Fetch all past week scores in one Snowflake query
  const allScores = throughWeek > 0 ? await fetchMultiWeekScores(throughWeek) : new Map()

  const result: Record<string, Array<{
    week: number
    label: string
    date_range: string   // e.g. "Jul 31 – Aug 3"
    matchups: {
      a: string; b: string; a_mascot: string; b_mascot: string
      score_a?: number; score_b?: number; is_past: boolean
    }[]
  }>> = {}

  for (const div of DIVISIONS) {
    const divKey = `${conference} ${div}`
    const divTeams = TEAMS
      .filter(t => t.division === divKey)
      .sort((a, b) => a.seed - b.seed)

    if (divTeams.length < 2) { result[divKey] = []; continue }

    const mascotMap = Object.fromEntries(divTeams.map(t => [t.employee_id, t.mascot]))
    const n = divTeams.length
    const totalRounds = n - 1  // 7 rounds for 8 teams

    const weeks: typeof result[string] = []
    for (let round = 1; round <= totalRounds; round++) {
      const weekInfo  = SEASON_WEEKS[round - 1]
      const roundDates = getWeekDates(round)
      const fmt = (iso: string) => {
        const d = new Date(iso + "T12:00:00Z")
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
      }
      const dateRange = `${fmt(roundDates[0])} – ${fmt(roundDates[roundDates.length - 1])}`
      const pairs = getWeekMatchups(divTeams, round)
      const isPast = round <= throughWeek
      const scoreMap = isPast ? allScores.get(round) : undefined

      weeks.push({
        week: round,
        label: weekInfo?.label ?? `Round ${round}`,
        date_range: dateRange,
        matchups: pairs.map(([a, b]) => {
          const base = {
            a: a.employee_id,
            b: b.employee_id,
            a_mascot: mascotMap[a.employee_id],
            b_mascot: mascotMap[b.employee_id],
            is_past: isPast,
          }
          if (!isPast || !scoreMap) return base

          const drive = simulateWeeklyDrive(a.employee_id, b.employee_id, round, DEMO_DAYS, scoreMap)
          const winner = drive.score_a > drive.score_b ? "A"
            : drive.score_b > drive.score_a ? "B"
            : drive.ball_pos > 50 ? "B"   // ball in B's half = B ahead
            : drive.ball_pos < 50 ? "A"   // ball in A's half = A ahead
            : "T"
          return { ...base, score_a: drive.score_a, score_b: drive.score_b, winner }
        }),
      })
    }

    result[divKey] = weeks
  }

  return Response.json(result)
}
