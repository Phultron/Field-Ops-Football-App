/**
 * Live scoring engine — queries a daily performance-metrics table for real manager metrics.
 *
 * NOTE: This is a placeholder/generic schema. Replace MY_DB.MY_SCHEMA.DAILY_METRICS and the
 * column names below with your own data source and metric columns.
 *
 * To switch from test dates to the real competition, change COMPETITION_START in ./config.
 *
 * Metric formulas (all produce 0–100):
 *   Referrals  = WEIGHTED_REFERRALS / VALID_INSTALL_COUNT × 1000  (cap 100; 10/100 = perfect)
 *   Upsell %   = (installs w/ upsell revenue > 0) / VALID_INSTALL_COUNT_REVENUE × 100
 *   VPP %      = (protection plan sold: base+mobile+mobile_plus) / VALID_INSTALL_COUNT_PROTECTION_PLAN × 100
 *   Composite  = referrals × 0.4 + upsell_pct × 0.4 + vpp × 0.2
 *
 * Employee filter: EMPLOYEE_TYPE = 'FIELD_PRO' (excludes managers)
 */

import { querySnowflake } from "./snowflake"
import type { DemoScore } from "./demo"
import { TEAMS } from "./teams"
import { COMPETITION_START } from "./config"

export { COMPETITION_START }

// All 32 manager employee IDs from lib/teams.ts
const ALL_MANAGER_IDS = TEAMS.map(t => Number(t.employee_id))

/** Returns the 4 Mon–Thu ISO date strings for a given game week (1-based). */
export function getWeekDates(weekNum: number): string[] {
  const start = new Date(COMPETITION_START + "T12:00:00Z")
  start.setUTCDate(start.getUTCDate() + (weekNum - 1) * 7)
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function zeroScore(): DemoScore {
  return { referrals: 0, upsell_pct: 0, vpp: 0, composite_score: 0 }
}

/**
 * Fetch live scores for multiple game weeks in a single Snowflake query.
 * Returns Map<weekNum, Map<employeeId, DemoScore[]>>
 */
export async function fetchMultiWeekScores(throughWeek: number): Promise<Map<number, Map<string, DemoScore[]>>> {
  const result = new Map<number, Map<string, DemoScore[]>>()
  if (throughWeek < 1) return result

  // Build date → weekNum mapping
  const dateToWeek = new Map<string, number>()
  const allDates: string[] = []
  for (let wk = 1; wk <= throughWeek; wk++) {
    for (const d of getWeekDates(wk)) {
      dateToWeek.set(d, wk)
      allDates.push(d)
    }
    // Initialise each week's map with zeros
    const weekMap = new Map<string, DemoScore[]>()
    for (const id of ALL_MANAGER_IDS) {
      weekMap.set(String(id), [zeroScore(), zeroScore(), zeroScore(), zeroScore()])
    }
    result.set(wk, weekMap)
  }

  const idList = ALL_MANAGER_IDS.join(", ")
  const dateList = allDates.map(d => `'${d}'`).join(", ")

  const sql = `
    SELECT
      EMPLOYEE_MANAGER_ID::VARCHAR                              AS employee_id,
      METRIC_DATE::VARCHAR                                       AS score_date,
      LEAST(COALESCE(
        DIV0(SUM(WEIGHTED_REFERRALS),
             SUM(VALID_INSTALL_COUNT)) * 1000, 0), 100) AS referrals,
      LEAST(COALESCE(
        DIV0(SUM(CASE WHEN UPSELL_REVENUE > 0 THEN 1 ELSE 0 END),
             SUM(VALID_INSTALL_COUNT_REVENUE)) * 100, 0), 100) AS upsell_pct,
      LEAST(COALESCE(
        DIV0(SUM(PROTECTION_PLAN_SOLD_BASE + PROTECTION_PLAN_SOLD_MOBILE + PROTECTION_PLAN_SOLD_MOBILE_PLUS),
             SUM(VALID_INSTALL_COUNT_PROTECTION_PLAN)) * 100, 0), 100) AS vpp
    FROM MY_DB.MY_SCHEMA.DAILY_METRICS
    WHERE EMPLOYEE_MANAGER_ID::NUMBER IN (${idList})
      AND METRIC_DATE IN (${dateList})
      AND EMPLOYEE_TYPE = 'FIELD_PRO'
    GROUP BY EMPLOYEE_MANAGER_ID, METRIC_DATE
    ORDER BY employee_id, score_date
  `

  let rows: Record<string, any>[] = []
  try {
    rows = await querySnowflake(sql, { warehouse: "MY_WAREHOUSE" })
  } catch (err) {
    console.error("[live-scoring] Multi-week fetch failed, using zeros:", err)
    return result
  }

  for (const row of rows) {
    const eid      = String(row.EMPLOYEE_ID ?? row.employee_id)
    const dateStr  = String(row.SCORE_DATE   ?? row.score_date)
    const weekNum  = dateToWeek.get(dateStr)
    if (!weekNum) continue

    const weekDates = getWeekDates(weekNum)
    const dayIdx    = weekDates.indexOf(dateStr)
    if (dayIdx < 0) continue

    const weekMap = result.get(weekNum)
    const scores  = weekMap?.get(eid)
    if (!scores) continue

    const referrals       = Math.min(100, Math.round(Number(row.REFERRALS  ?? row.referrals)  || 0))
    const upsell_pct      = Math.min(100, Math.round(Number(row.UPSELL_PCT ?? row.upsell_pct) || 0))
    const vpp             = Math.min(100, Math.round(Number(row.VPP        ?? row.vpp)        || 0))
    const composite_score = Math.min(100, Math.round(referrals * 0.4 + upsell_pct * 0.4 + vpp * 0.2))

    scores[dayIdx] = { referrals, upsell_pct, vpp, composite_score }
  }

  return result
}
export async function fetchWeekScores(weekNum: number): Promise<Map<string, DemoScore[]>> {
  const dates = getWeekDates(weekNum)
  const idList = ALL_MANAGER_IDS.join(", ")

  // One batched query: all 32 managers × 4 days
  const sql = `
    SELECT
      EMPLOYEE_MANAGER_ID::VARCHAR                              AS employee_id,
      METRIC_DATE::VARCHAR                                       AS score_date,
      -- Referrals/100 normalised: (weighted_refs / valid_installs) × 1000, capped at 100
      LEAST(COALESCE(
        DIV0(SUM(WEIGHTED_REFERRALS),
             SUM(VALID_INSTALL_COUNT)) * 1000, 0), 100) AS referrals,
      -- Upsell % (installs with upsell revenue > 0, over revenue-eligible installs)
      LEAST(COALESCE(
        DIV0(SUM(CASE WHEN UPSELL_REVENUE > 0 THEN 1 ELSE 0 END),
             SUM(VALID_INSTALL_COUNT_REVENUE)) * 100, 0), 100) AS upsell_pct,
      -- Protection plan % (plan sold, over plan-eligible installs)
      LEAST(COALESCE(
        DIV0(SUM(PROTECTION_PLAN_SOLD_BASE + PROTECTION_PLAN_SOLD_MOBILE + PROTECTION_PLAN_SOLD_MOBILE_PLUS),
             SUM(VALID_INSTALL_COUNT_PROTECTION_PLAN)) * 100, 0), 100) AS vpp
    FROM MY_DB.MY_SCHEMA.DAILY_METRICS
    WHERE EMPLOYEE_MANAGER_ID::NUMBER IN (${idList})
      AND METRIC_DATE IN (${dates.map(d => `'${d}'`).join(", ")})
      AND EMPLOYEE_TYPE = 'FIELD_PRO'
    GROUP BY EMPLOYEE_MANAGER_ID, METRIC_DATE
    ORDER BY employee_id, score_date
  `

  // Initialise all managers with 4 zero-score slots
  const result = new Map<string, DemoScore[]>()
  for (const id of ALL_MANAGER_IDS) {
    result.set(String(id), [zeroScore(), zeroScore(), zeroScore(), zeroScore()])
  }

  let rows: Record<string, any>[] = []
  try {
    rows = await querySnowflake(sql, { warehouse: "MY_WAREHOUSE" })
  } catch (err) {
    // Graceful fallback: return zeros so the UI still renders
    console.error("[live-scoring] Snowflake query failed, using zeros:", err)
    return result
  }

  for (const row of rows) {
    const eid = String(row.EMPLOYEE_ID ?? row.employee_id)
    const dateStr = String(row.SCORE_DATE ?? row.score_date)
    const dayIdx = dates.indexOf(dateStr)
    if (dayIdx < 0) continue

    const scores = result.get(eid)
    if (!scores) continue

    const referrals      = Math.min(100, Math.round(Number(row.REFERRALS  ?? row.referrals)  || 0))
    const upsell_pct     = Math.min(100, Math.round(Number(row.UPSELL_PCT ?? row.upsell_pct) || 0))
    const vpp            = Math.min(100, Math.round(Number(row.VPP        ?? row.vpp)        || 0))
    const composite_score = Math.min(100, Math.round(referrals * 0.4 + upsell_pct * 0.4 + vpp * 0.2))

    scores[dayIdx] = { referrals, upsell_pct, vpp, composite_score }
  }

  return result
}
