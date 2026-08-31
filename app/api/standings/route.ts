// GET /api/standings?conference=AFC&throughWeek=3
import { NextRequest } from "next/server"
import { TEAMS, DIVISIONS, getWeekMatchups } from "@/lib/teams"
import { simulateWeeklyDrive, DEMO_DAYS, SEASON_WEEKS } from "@/lib/demo"
import { fetchWeekScores } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

interface TeamStanding {
  team_id: string
  mascot: string
  manager: string
  district: string
  seed: number
  wins: number
  losses: number
  ties: number
  composite_score: number
  division: string
}

export async function GET(req: NextRequest) {
  const conference = req.nextUrl.searchParams.get("conference") ?? "AFC"
  const throughWeek = Math.min(
    SEASON_WEEKS.length,
    Math.max(1, parseInt(
      req.nextUrl.searchParams.get("throughWeek") ??
      req.nextUrl.searchParams.get("week") ??
      "1",
      10
    ))
  )

  const standings: Record<string, TeamStanding> = {}

  for (const team of TEAMS.filter(t => t.conference === conference)) {
    standings[team.employee_id] = {
      team_id: team.employee_id,
      mascot: team.mascot,
      manager: team.manager_name,
      district: team.district,
      seed: team.seed,
      wins: 0, losses: 0, ties: 0,
      composite_score: 0,
      division: team.division,
    }
  }

  for (let wk = 1; wk <= throughWeek; wk++) {
    // Fetch live scores for this week (one Snowflake query per week)
    const scoreMap = await fetchWeekScores(wk)

    for (const div of DIVISIONS) {
      const divKey = `${conference} ${div}`
      const divTeams = TEAMS.filter(t => t.division === divKey).sort((a, b) => a.seed - b.seed)
      if (divTeams.length < 2) continue

      const matchups = getWeekMatchups(divTeams, wk)
      for (const [a, b] of matchups) {
        const drive = simulateWeeklyDrive(a.employee_id, b.employee_id, wk, DEMO_DAYS, scoreMap)

        // Accumulate composite score (average across active days)
        const aScores = scoreMap.get(a.employee_id) ?? []
        const bScores = scoreMap.get(b.employee_id) ?? []
        const aActiveDays = aScores.filter(d => d.composite_score > 0).length
        const bActiveDays = bScores.filter(d => d.composite_score > 0).length
        const aWeekScore = aActiveDays > 0
          ? Math.round(aScores.reduce((s, d) => s + d.composite_score, 0) / aActiveDays)
          : 0
        const bWeekScore = bActiveDays > 0
          ? Math.round(bScores.reduce((s, d) => s + d.composite_score, 0) / bActiveDays)
          : 0

        if (standings[a.employee_id]) standings[a.employee_id].composite_score += aWeekScore
        if (standings[b.employee_id]) standings[b.employee_id].composite_score += bWeekScore

        if (drive.score_a > drive.score_b) {
          if (standings[a.employee_id]) standings[a.employee_id].wins++
          if (standings[b.employee_id]) standings[b.employee_id].losses++
        } else if (drive.score_b > drive.score_a) {
          if (standings[b.employee_id]) standings[b.employee_id].wins++
          if (standings[a.employee_id]) standings[a.employee_id].losses++
        } else {
          if (standings[a.employee_id]) standings[a.employee_id].ties++
          if (standings[b.employee_id]) standings[b.employee_id].ties++
        }
      }
    }
  }

  const result: Record<string, TeamStanding[]> = {}
  for (const div of DIVISIONS) {
    const divKey = `${conference} ${div}`
    result[divKey] = Object.values(standings)
      .filter(s => s.division === divKey)
      .sort((a, b) => b.wins - a.wins || b.composite_score - a.composite_score)
  }

  return Response.json(result)
}
