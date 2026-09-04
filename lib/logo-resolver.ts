/**
 * Logo/color resolution — decouples the static TEAM_LOGOS palette (keyed by placeholder
 * "1001".."1032" ids) from whichever employee_id values are actually in play at runtime
 * (placeholder or real, depending on DATA_SOURCE). No real employee ID needs to be
 * hardcoded anywhere in this file or in lib/teams.ts.
 *
 * Each team's color/icon combo is picked by its (division, seed) slot — the same slot
 * order the static TEAMS array in lib/teams.ts already uses — then keyed by that team's
 * actual employee_id so existing `TEAM_LOGOS[employeeId]`-style lookups keep working.
 */

import { TEAMS, TEAM_LOGOS, DIVISIONS, type Team, type TeamLogo } from "./teams"

// The static roster's employee_ids, in the exact division/seed order they're declared —
// this is the canonical 32-slot palette order ("1001".."1032" today).
const STATIC_SLOT_ORDER: string[] = TEAMS.map(t => t.employee_id)

const DEFAULT_LOGO: TeamLogo = { primary: "#374151", accent: "#9CA3AF", icon: "bolt" }

function slotIndexFor(team: Team): number {
  // division is formatted "<conference-prefix> <letter>", e.g. "Conf A".
  const letter = team.division.trim().split(" ").pop() ?? ""
  const divIdx = DIVISIONS.indexOf(letter as typeof DIVISIONS[number])
  if (divIdx < 0 || !team.seed || team.seed < 1) return -1
  return divIdx * 8 + (team.seed - 1)
}

/**
 * Returns a map of employee_id -> TeamLogo for the given teams, reusing the static
 * TEAM_LOGOS palette by (division, seed) slot rather than by literal employee_id.
 */
export function resolveLogos(teams: Team[]): Record<string, TeamLogo> {
  const map: Record<string, TeamLogo> = {}
  for (const team of teams) {
    const idx = slotIndexFor(team)
    const slotKey = idx >= 0 ? STATIC_SLOT_ORDER[idx] : undefined
    map[team.employee_id] = (slotKey && TEAM_LOGOS[slotKey]) || DEFAULT_LOGO
  }
  return map
}
