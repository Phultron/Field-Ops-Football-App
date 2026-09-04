// GET /api/playoffs — single-conference bracket: semis (week 8) → championship (week 9)
import { DIVISIONS, getWeekMatchups, type Team } from "@/lib/teams"
import { getRoster } from "@/lib/roster"
import { demoScore, simulateWeeklyDrive, DEMO_DAYS } from "@/lib/demo"

export const dynamic = "force-dynamic"

const REG_SEASON_WEEKS = 7

interface PlayoffTeam {
  employee_id: string
  mascot: string
  manager: string
  division: string
  reg_wins: number
  reg_yards: number
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

function getDivisionWinner(teams: Team[], divSuffix: string): PlayoffTeam | null {
  const divKey = `Conf ${divSuffix}`
  const divTeams = teams.filter(t => t.division === divKey)
  const record: Record<string, { wins: number; yards: number }> = {}
  for (const t of divTeams) record[t.employee_id] = { wins: 0, yards: 0 }

  for (let wk = 1; wk <= REG_SEASON_WEEKS; wk++) {
    const matchups = getWeekMatchups(divTeams, wk)
    for (const [a, b] of matchups) {
      if (!a || !b) continue
      const drive = simulateWeeklyDrive(a.employee_id, b.employee_id, wk, DEMO_DAYS)
      record[a.employee_id].yards += demoScore(a.employee_id, wk).composite_score
      record[b.employee_id].yards += demoScore(b.employee_id, wk).composite_score
      if (drive.score_a > drive.score_b)      record[a.employee_id].wins++
      else if (drive.score_b > drive.score_a)  record[b.employee_id].wins++
    }
  }

  const winner = [...divTeams].sort(
    (x, y) => (record[y.employee_id]?.wins ?? 0) - (record[x.employee_id]?.wins ?? 0)
      || (record[y.employee_id]?.yards ?? 0) - (record[x.employee_id]?.yards ?? 0)
  )[0]

  if (!winner) return null
  return {
    employee_id: winner.employee_id,
    mascot: winner.mascot,
    manager: winner.manager_name,
    division: winner.division,
    reg_wins: record[winner.employee_id]?.wins ?? 0,
    reg_yards: record[winner.employee_id]?.yards ?? 0,
    seed: winner.seed,
  }
}

function makeMatchup(teamA: PlayoffTeam, teamB: PlayoffTeam, week: number): PlayoffMatchup {
  const drive = simulateWeeklyDrive(teamA.employee_id, teamB.employee_id, week, DEMO_DAYS)
  return {
    team_a: teamA,
    team_b: teamB,
    score_a: drive.score_a,
    score_b: drive.score_b,
    winner: drive.score_a > drive.score_b ? "A" : drive.score_b > drive.score_a ? "B" : null,
    week,
  }
}

export async function GET() {
  const roster = await getRoster()
  // 4 division winners seeded by regular-season wins
  const winners = DIVISIONS
    .map(d => getDivisionWinner(roster, d))
    .filter(Boolean)
    .sort((a, b) => (b!.reg_wins - a!.reg_wins) || (b!.reg_yards - a!.reg_yards)) as PlayoffTeam[]

  winners.forEach((t, i) => t.seed = i + 1)

  // Semis (Week 8): 1v4, 2v3
  const semi1 = makeMatchup(winners[0], winners[3], 8)
  const semi2 = makeMatchup(winners[1], winners[2], 8)

  const champA = semi1.winner === "A" ? semi1.team_a : semi1.team_b
  const champB = semi2.winner === "A" ? semi2.team_a : semi2.team_b

  // Championship (Week 9)
  const championship = makeMatchup(champA, champB, 9)
  const champion = championship.winner === "A" ? championship.team_a : championship.team_b

  return Response.json({ semis: [semi1, semi2], championship, champion })
}
