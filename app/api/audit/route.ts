// GET /api/audit?conference=Conf&week=2
// Raw per-team metric breakdown — only the fields that build the composite score.
import { NextRequest } from "next/server"
import { DIVISIONS } from "@/lib/teams"
import { getRoster } from "@/lib/roster"
import { fetchWeekScores } from "@/lib/live-scoring"

export const dynamic = "force-dynamic"

interface AuditRow {
  team_id: string
  mascot: string
  manager: string
  district: string
  seed: number
  division: string
  referrals: number       // 0–100, weight 40%
  upsell_pct: number      // 0–100, weight 40%
  vpp: number             // 0–100, weight 20%
  composite_score: number // referrals*0.4 + upsell_pct*0.4 + vpp*0.2
  active_days: number      // days with data out of 4
}

export async function GET(req: NextRequest) {
  const conference = req.nextUrl.searchParams.get("conference") ?? "Conf"
  const week = Math.max(1, parseInt(req.nextUrl.searchParams.get("week") ?? "1", 10))

  const TEAMS = await getRoster()
  const scoreMap = await fetchWeekScores(week)

  const avgField = (scores: ReturnType<typeof scoreMap.get>, field: "referrals" | "upsell_pct" | "vpp" | "composite_score") => {
    if (!scores) return 0
    const active = scores.filter(d => d.composite_score > 0)
    if (active.length === 0) return 0
    return Math.round(active.reduce((s, d) => s + Number(d[field]), 0) / active.length)
  }

  const result: Record<string, AuditRow[]> = {}

  for (const div of DIVISIONS) {
    const divKey = `${conference} ${div}`
    const divTeams = TEAMS
      .filter(t => t.division === divKey && t.conference === conference)
      .sort((a, b) => a.seed - b.seed)

    result[divKey] = divTeams.map(t => {
      const scores = scoreMap.get(t.employee_id)
      const activeDays = scores?.filter(d => d.composite_score > 0).length ?? 0
      return {
        team_id: t.employee_id,
        mascot: t.mascot,
        manager: t.manager_name,
        district: t.district,
        seed: t.seed,
        division: t.division,
        referrals: avgField(scores, "referrals"),
        upsell_pct: avgField(scores, "upsell_pct"),
        vpp: avgField(scores, "vpp"),
        composite_score: avgField(scores, "composite_score"),
        active_days: activeDays,
      }
    })
  }

  return Response.json(result)
}
