// Demo scoring engine — deterministic synthetic scores via MD5-hash
import { createHash } from "crypto"

export const MAX_SCORE = 100
export const DEMO_DAYS = 4 // days simulated per game

// Season calendar: 9 regular-season weeks starting Sep 8 2026
export const SEASON_WEEKS: { label: string; start: Date; end: Date }[] = Array.from(
  { length: 9 },
  (_, i) => {
    const start = new Date("2026-09-08")
    start.setDate(start.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 4)
    return {
      label: `Round ${i + 1}`,
      start,
      end,
    }
  }
)

export interface DemoScore {
  referrals: number      // 0–100 (referral count, normalized to max 100)
  upsell_pct: number     // 0–100 (upsell / install %)
  vpp: number            // 0–100 (VPP score)
  composite_score: number // weighted composite: referrals×0.4 + upsell_pct×0.4 + vpp×0.2
}

/** Deterministic synthetic score for a given employee + seed (week or week*10+day). */
export function demoScore(employeeId: string, seed: number): DemoScore {
  const hash = (s: string): number => {
    const hex = createHash("md5").update(s).digest("hex")
    return parseInt(hex.slice(0, 8), 16)
  }

  const referrals  = hash(`ref_${employeeId}_${seed}`)  % 101  // 0–100
  const upsellPct  = hash(`up_${employeeId}_${seed}`)   % 101  // 0–100
  const vpp        = hash(`vpp_${employeeId}_${seed}`)  % 101  // 0–100

  const composite = Math.round(referrals * 0.4 + upsellPct * 0.4 + vpp * 0.2)

  return {
    referrals,
    upsell_pct: upsellPct,
    vpp,
    composite_score: composite,
  }
}

export interface DriveResult {
  ball_pos: number   // 0–100, where 0=team A endzone, 100=team B endzone
  td_a: number
  td_b: number
  fg_a: number
  fg_b: number
  last_net: number
  score_a: number    // td_a * 7 + fg_a * 3
  score_b: number    // td_b * 7 + fg_b * 3
  days_played: number
}

/** Simulate the weekly "drive" mechanic.
 *  Ball starts at 50, moves ±40 yards per day based on relative performance.
 *  TD scored when ball reaches ≥90 (team A scores) or ≤10 (team B scores).
 *
 *  @param scoreMap  Optional live scores from fetchWeekScores(). When provided,
 *                   real Snowflake data is used instead of the demo hash engine.
 */
export function simulateWeeklyDrive(
  eidA: string,
  eidB: string,
  weekNum: number,
  daysPlayed: number,
  scoreMap?: Map<string, DemoScore[]>
): DriveResult {
  let ballPos = 50.0
  let tdA = 0
  let tdB = 0
  let fgA = 0
  let fgB = 0
  let lastNet = 0

  const days = Math.min(daysPlayed, 4)

  for (let day = 1; day <= days; day++) {
    let saD: number, sbD: number
    if (scoreMap) {
      saD = scoreMap.get(eidA)?.[day - 1]?.composite_score ?? 0
      sbD = scoreMap.get(eidB)?.[day - 1]?.composite_score ?? 0
    } else {
      saD = demoScore(eidA, weekNum * 10 + day).composite_score
      sbD = demoScore(eidB, weekNum * 10 + day).composite_score
    }
    const net = ((saD - sbD) / MAX_SCORE) * 80   // doubled from 40 → more scoring
    lastNet = net
    ballPos = Math.min(98, Math.max(2, ballPos + net))

    if (ballPos >= 90) {
      tdA += 1
      ballPos = 50
    } else if (ballPos >= 75) {
      fgA += 1
      ballPos = 50
    } else if (ballPos <= 10) {
      tdB += 1
      ballPos = 50
    } else if (ballPos <= 25) {
      fgB += 1
      ballPos = 50
    }
  }

  return {
    ball_pos: ballPos,
    td_a: tdA,
    td_b: tdB,
    fg_a: fgA,
    fg_b: fgB,
    last_net: lastNet,
    score_a: tdA * 7 + fgA * 3,
    score_b: tdB * 7 + fgB * 3,
    days_played: days,
  }
}

/** How many days into the current week (0 = not started). Capped at DEMO_DAYS. */
export function daysElapsed(weekNum: number): number {
  const week = SEASON_WEEKS[weekNum - 1]
  if (!week) return DEMO_DAYS
  const now = new Date()
  const diff = Math.floor((now.getTime() - week.start.getTime()) / 86_400_000)
  return Math.max(DEMO_DAYS, Math.min(DEMO_DAYS, diff)) // demo always shows DEMO_DAYS
}

/** Grammar-aware possessive: "Hawks" → "Hawks'" · "Tide" → "Tide's" */
export function possessive(word: string): string {
  return word.endsWith("s") ? `${word}'` : `${word}'s`
}

/** NFL-style yardline label from field position 0–100. */
export function yardlineLabel(pct: number): string {
  pct = Math.max(0, Math.min(100, pct))
  if (pct < 50) return `OWN ${Math.round(pct)}`
  if (pct > 50) return `OPP ${Math.round(100 - pct)}`
  return "50"
}

/** Build a round-robin schedule for 6 teams (9-week season). */
export function buildSchedule(teamIds: string[]): Array<{ week: number; a: string; b: string }[]> {
  const ids = [...teamIds]
  const n = ids.length
  const rounds: Array<{ week: number; a: string; b: string }[]> = []

  for (let round = 0; round < n - 1; round++) {
    const matchups: { week: number; a: string; b: string }[] = []
    for (let i = 0; i < n / 2; i++) {
      matchups.push({ week: round + 1, a: ids[i], b: ids[n - 1 - i] })
    }
    rounds.push(matchups)
    // rotate: fix last, rotate the rest
    ids.splice(1, 0, ids.pop()!)
  }

  return rounds
}
