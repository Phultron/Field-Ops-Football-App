// GET /api/games?week=1&division=AFC+East
import { NextRequest } from "next/server"
import { getTeamsByDivision, TEAM_LOGOS, DIVISION_COLORS, getWeekMatchups } from "@/lib/teams"
import { demoScore, simulateWeeklyDrive, DEMO_DAYS } from "@/lib/demo"
import { fetchWeekScores } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const week = parseInt(req.nextUrl.searchParams.get("week") ?? "1", 10)
  const division = req.nextUrl.searchParams.get("division") ?? "AFC East"
  const [conference, div] = division.split(" ")

  const teams = getTeamsByDivision(conference, div)
  if (teams.length < 2) return Response.json([])

  const matchups = getWeekMatchups(teams, week)

  // Fetch live scores for all managers for this week (one query for all)
  const scoreMap = await fetchWeekScores(week)

  const games = matchups.map(([a, b]) => {
    // Per-team weekly average score for display (average across days with data)
    const saRaw = scoreMap.get(a.employee_id) ?? []
    const sbRaw = scoreMap.get(b.employee_id) ?? []

    const avgScore = (scores: typeof saRaw, field: keyof (typeof saRaw)[0]) => {
      const active = scores.filter(d => d.composite_score > 0)
      if (active.length === 0) return 0
      return Math.round(active.reduce((s, d) => s + Number(d[field]), 0) / active.length)
    }

    const sa = {
      referrals:       avgScore(saRaw, "referrals"),
      upsell_pct:      avgScore(saRaw, "upsell_pct"),
      vpp:             avgScore(saRaw, "vpp"),
      composite_score: avgScore(saRaw, "composite_score"),
    }
    const sb = {
      referrals:       avgScore(sbRaw, "referrals"),
      upsell_pct:      avgScore(sbRaw, "upsell_pct"),
      vpp:             avgScore(sbRaw, "vpp"),
      composite_score: avgScore(sbRaw, "composite_score"),
    }

    const drive = simulateWeeklyDrive(a.employee_id, b.employee_id, week, DEMO_DAYS, scoreMap)

    // Day-by-day ball positions for the animation.
    // Inject scoring positions before reset so the client animation detects them:
    //   TD for A: 95 → 50    FG for A: 82 → 50
    //   TD for B:  5 → 50    FG for B: 18 → 50
    const ballPositions: number[] = [50]
    let prevTdA = 0, prevTdB = 0, prevFgA = 0, prevFgB = 0
    for (let d = 1; d <= DEMO_DAYS; d++) {
      const result = simulateWeeklyDrive(a.employee_id, b.employee_id, week, d, scoreMap)
      if (result.td_a > prevTdA) {
        ballPositions.push(95); ballPositions.push(50); prevTdA = result.td_a
      } else if (result.td_b > prevTdB) {
        ballPositions.push(5);  ballPositions.push(50); prevTdB = result.td_b
      } else if (result.fg_a > prevFgA) {
        ballPositions.push(82); ballPositions.push(50); prevFgA = result.fg_a
      } else if (result.fg_b > prevFgB) {
        ballPositions.push(18); ballPositions.push(50); prevFgB = result.fg_b
      } else {
        ballPositions.push(result.ball_pos)
      }
    }

    const logoA = TEAM_LOGOS[a.employee_id]
    const logoB = TEAM_LOGOS[b.employee_id]
    const divColors = DIVISION_COLORS[a.division] ?? { primary: "#374151", light: "#9CA3AF" }

    const mascotLastA = a.mascot.split(" ").at(-1)!
    const mascotLastB = b.mascot.split(" ").at(-1)!
    const winner = drive.score_a > drive.score_b ? "A" : drive.score_b > drive.score_a ? "B" : "T"
    const glowColor =
      winner === "A" ? logoA?.primary :
      winner === "B" ? logoB?.primary :
      null

    const pct = Math.max(0, Math.min(100, drive.ball_pos))
    let ballOn: string
    if (pct < 50) {
      const yd = Math.round(pct)
      ballOn = mascotLastA.endsWith("s") ? `${mascotLastA}' ${yd}` : `${mascotLastA}'s ${yd}`
    } else if (pct > 50) {
      const yd = Math.round(100 - pct)
      ballOn = mascotLastB.endsWith("s") ? `${mascotLastB}' ${yd}` : `${mascotLastB}'s ${yd}`
    } else {
      ballOn = "Midfield"
    }

    return {
      week,
      team_a: a,
      team_b: b,
      score_a: { referrals: sa.referrals, upsell_pct: sa.upsell_pct, vpp: sa.vpp, composite_score: sa.composite_score },
      score_b: { referrals: sb.referrals, upsell_pct: sb.upsell_pct, vpp: sb.vpp, composite_score: sb.composite_score },
      drive,
      ball_positions: ballPositions,
      ball_on: ballOn,
      glow_color: glowColor,
      div_color: divColors,
      logo_a: logoA ?? null,
      logo_b: logoB ?? null,
    }
  })

  return Response.json(games)
}
