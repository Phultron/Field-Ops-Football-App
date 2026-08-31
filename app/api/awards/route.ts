// GET /api/awards?week=1
import { NextRequest } from "next/server"
import { TEAMS } from "@/lib/teams"
import { fetchWeekScores } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const week = parseInt(req.nextUrl.searchParams.get("week") ?? "1", 10)

  const scoreMap = await fetchWeekScores(week)

  let heisman        = { mascot: "", manager: "", yards: 0, team_id: "" }
  let referralsLeader = { mascot: "", manager: "", yards: 0, team_id: "" }
  let upsellLeader   = { mascot: "", manager: "", yards: 0, team_id: "" }
  let vppLeader      = { mascot: "", manager: "", yards: 0, team_id: "" }

  for (const team of TEAMS) {
    const dayScores = scoreMap.get(team.employee_id) ?? []
    const activeDays = dayScores.filter(d => d.composite_score > 0).length || 1
    const info = { mascot: team.mascot, manager: team.manager_name, team_id: team.employee_id }

    const composite = Math.round(dayScores.reduce((s, d) => s + d.composite_score, 0) / activeDays)
    const referrals  = Math.round(dayScores.reduce((s, d) => s + d.referrals, 0) / activeDays)
    const upsell     = Math.round(dayScores.reduce((s, d) => s + d.upsell_pct, 0) / activeDays)
    const vpp        = Math.round(dayScores.reduce((s, d) => s + d.vpp, 0) / activeDays)

    if (composite  > heisman.yards)        heisman        = { ...info, yards: composite }
    if (referrals  > referralsLeader.yards) referralsLeader = { ...info, yards: referrals }
    if (upsell     > upsellLeader.yards)   upsellLeader   = { ...info, yards: upsell }
    if (vpp        > vppLeader.yards)      vppLeader      = { ...info, yards: vpp }
  }

  return Response.json({
    week,
    heisman,
    referrals_leader: referralsLeader,
    upsell_leader:   upsellLeader,
    vpp_leader:      vppLeader,
  })
}
