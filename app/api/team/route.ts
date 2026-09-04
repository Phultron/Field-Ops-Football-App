// GET /api/team?id=98843&throughWeek=5
import { NextRequest } from "next/server"
import { getWeekMatchups } from "@/lib/teams"
import { getRoster } from "@/lib/roster"
import { simulateWeeklyDrive, DEMO_DAYS, SEASON_WEEKS } from "@/lib/demo"
import { fetchWeekScores } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? ""
  const throughWeek = Math.min(
    SEASON_WEEKS.length,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("throughWeek") ?? String(SEASON_WEEKS.length), 10))
  )

  const roster = await getRoster()
  const team = roster.find(t => t.employee_id === id)
  if (!team) return Response.json({ error: "Team not found" }, { status: 404 })

  const divTeams = roster
    .filter(t => t.division === team.division)
    .sort((a, b) => a.seed - b.seed)

  const weeklyScores: Array<{
    week: number; label: string
    composite_score: number; referrals: number; upsell_pct: number; vpp: number
    win: boolean | null
  }> = []
  let wins = 0, losses = 0, ties = 0

  for (let wk = 1; wk <= throughWeek; wk++) {
    const scoreMap = await fetchWeekScores(wk)
    const dayScores = scoreMap.get(team.employee_id) ?? []
    const activeDays = dayScores.filter(d => d.composite_score > 0).length || 1

    const composite_score = Math.round(dayScores.reduce((s, d) => s + d.composite_score, 0) / activeDays)
    const referrals       = dayScores.reduce((s, d) => s + d.referrals, 0)
    const upsell_pct      = Math.round(dayScores.reduce((s, d) => s + d.upsell_pct, 0) / activeDays)
    const vpp             = Math.round(dayScores.reduce((s, d) => s + d.vpp, 0) / activeDays)

    const matchups = getWeekMatchups(divTeams, wk)
    const myMatchup = matchups.find(([a, b]) =>
      a.employee_id === team.employee_id || b.employee_id === team.employee_id
    )

    let win: boolean | null = null
    if (myMatchup) {
      const isA = myMatchup[0].employee_id === team.employee_id
      const opp = isA ? myMatchup[1] : myMatchup[0]
      const drive = isA
        ? simulateWeeklyDrive(team.employee_id, opp.employee_id, wk, DEMO_DAYS, scoreMap)
        : simulateWeeklyDrive(opp.employee_id, team.employee_id, wk, DEMO_DAYS, scoreMap)
      const teamScore = isA ? drive.score_a : drive.score_b
      const oppScore  = isA ? drive.score_b : drive.score_a
      if (teamScore > oppScore)      { wins++;   win = true }
      else if (oppScore > teamScore) { losses++; win = false }
      else                           { ties++ }
    }

    weeklyScores.push({
      week: wk,
      label: SEASON_WEEKS[wk - 1]?.label ?? `Week ${wk}`,
      composite_score,
      referrals,
      upsell_pct,
      vpp,
      win,
    })
  }

  // Next 2 upcoming matchups
  const upcoming = SEASON_WEEKS
    .slice(throughWeek, throughWeek + 2)
    .map((w, i) => {
      const upWeek = throughWeek + i + 1
      const matchups = getWeekMatchups(divTeams, upWeek)
      const myMatchup = matchups.find(([a, b]) =>
        a.employee_id === team.employee_id || b.employee_id === team.employee_id
      )
      const opp = myMatchup
        ? (myMatchup[0].employee_id === team.employee_id ? myMatchup[1] : myMatchup[0])
        : null
      return {
        week: upWeek,
        label: w.label,
        opponent: opp ? { mascot: opp.mascot, manager: opp.manager_name, employee_id: opp.employee_id } : null,
      }
    })

  return Response.json({ team, wins, losses, ties, weeklyScores, upcoming })
}
