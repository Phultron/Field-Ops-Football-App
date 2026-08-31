// Team data for 32 fantasy football teams (4 divisions × 8 teams)
// NOTE: Manager names, districts, and employee IDs below are placeholder/generic data.
// If you clone this app for your own use, replace this file with your own roster.

export const ICON_PATHS: Record<string, string> = {
  bolt:     "M23,5 L13,21 L20,21 L16,35 L28,19 L21,19 Z",
  wolf:     "M8,10 L12,4 L16,12 L20,9 L24,12 L28,4 L32,10 L29,19 Q26,26 20,29 Q14,26 11,19 Z",
  eagle:    "M4,20 L14,12 L18,16 L20,13 L22,16 L26,12 L36,20 L29,23 Q24,32 20,35 Q16,32 11,23 Z",
  hawk:     "M4,22 L16,15 L20,19 L24,15 L36,22 L26,24 L23,34 L20,36 L17,34 L14,24 Z",
  flame:    "M20,34 Q11,30 11,21 Q11,13 18,9 Q15,5 17,3 Q20,7 20,12 Q22,8 24,6 Q24,13 28,15 Q31,19 29,25 Q27,33 20,34 Z",
  wave:     "M4,18 Q8,12 12,18 Q16,24 20,18 Q24,12 28,18 Q32,24 36,20 L36,26 Q32,30 28,22 Q24,14 20,24 Q16,32 12,24 Q8,16 4,24 Z",
  mountain: "M4,33 L20,7 L36,33 Z",
  peaks:    "M2,33 L12,13 L18,23 L22,15 L38,33 Z",
  storm:    "M9,22 Q7,14 13,11 Q13,7 20,7 Q27,7 27,11 Q33,11 33,17 Q35,21 31,23 L9,23 Z M14,26 Q13,30 14,33 Q16,30 15,26 Z M20,26 Q19,30 20,33 Q22,30 21,26 Z M26,26 Q25,30 26,33 Q28,30 27,26 Z",
  shield:   "M20,8 L33,14 L33,26 Q20,37 20,37 Q7,26 7,26 L7,14 Z",
  gear:     "M20,7 L23,11 L27,8 L25,13 L30,13 L27,18 L30,23 L25,23 L27,28 L23,25 L20,29 L17,25 L13,28 L15,23 L10,23 L13,18 L10,13 L15,13 L13,8 L17,11 Z",
  tree:     "M20,6 L11,17 L15,17 L9,25 L14,25 L11,32 L29,32 L26,25 L31,25 L25,17 L29,17 Z",
  palm:     "M18,22 L22,22 L22,34 L18,34 Z M20,22 Q12,16 8,12 Q14,16 20,22 Z M20,22 Q18,12 20,8 Q22,12 20,22 Z M20,22 Q26,16 32,12 Q28,18 20,22 Z",
  star:     "M20,5 L23,15 L33,15 L25,22 L28,32 L20,26 L12,32 L15,22 L7,15 L17,15 Z",
  sun:      "M20,5 L22,14 L28,8 L24,16 L32,15 L26,20 L32,25 L23,24 L22,34 L20,26 L18,34 L17,24 L8,25 L14,20 L8,15 L16,16 L12,8 L18,14 Z",
  surge:    "M7,14 L20,14 L20,8 L33,20 L20,32 L20,26 L7,26 Z",
  bull:     "M9,12 Q5,5 9,9 Q11,7 14,12 L14,22 Q14,27 20,29 Q26,27 26,22 L26,12 Q29,7 31,9 Q35,5 31,12 Q28,16 24,14 Q22,10 20,10 Q18,10 16,14 Q12,16 9,12 Z",
  skyline:  "M4,33 L4,22 L8,22 L8,17 L12,17 L12,22 L14,22 L14,13 L18,13 L18,22 L20,22 L20,9 L24,9 L24,18 L26,18 L26,14 L30,14 L30,19 L34,19 L34,24 L36,24 L36,33 Z",
  river:    "M4,15 Q8,10 12,16 Q16,22 20,16 Q24,10 28,16 Q32,22 36,17 L36,23 Q32,28 28,22 Q24,16 20,22 Q16,28 12,22 Q8,16 4,21 Z",
  rampage:  "M20,4 L23,14 L31,8 L26,18 L36,19 L27,24 L33,32 L22,27 L21,38 L19,26 L9,34 L14,24 L4,22 L14,19 L8,10 L18,16 Z",
}

export interface TeamLogo {
  primary: string
  accent: string
  icon: keyof typeof ICON_PATHS
}

export const TEAM_LOGOS: Record<string, TeamLogo> = {
  // Division A
  "1001": { primary: "#1565C0", accent: "#FFFFFF", icon: "hawk" },
  "1002": { primary: "#546E7A", accent: "#FF7043", icon: "mountain" },
  "1003": { primary: "#003087", accent: "#4FC3F7", icon: "bolt" },
  "1004": { primary: "#1C1C1C", accent: "#FFD700", icon: "gear" },
  "1005": { primary: "#6D4C41", accent: "#FFE0B2", icon: "surge" },
  "1006": { primary: "#2E7D32", accent: "#A5D6A7", icon: "river" },
  "1007": { primary: "#1B5E20", accent: "#B0BEC5", icon: "bolt" },
  "1008": { primary: "#004D40", accent: "#80DEEA", icon: "wave" },
  // Division B
  "1009": { primary: "#0D2B6B", accent: "#5E97F6", icon: "wolf" },
  "1010": { primary: "#4A148C", accent: "#CE93D8", icon: "storm" },
  "1011": { primary: "#004C54", accent: "#A5ACAF", icon: "shield" },
  "1012": { primary: "#00695C", accent: "#80CBC4", icon: "wave" },
  "1013": { primary: "#101820", accent: "#FFB612", icon: "gear" },
  "1014": { primary: "#880E4F", accent: "#F48FB1", icon: "surge" },
  "1015": { primary: "#002366", accent: "#FF4500", icon: "skyline" },
  "1016": { primary: "#004B23", accent: "#FFB612", icon: "bolt" },
  // Division C
  "1017": { primary: "#1B5E20", accent: "#FF6F00", icon: "bull" },
  "1018": { primary: "#1A1A1A", accent: "#C0C0C0", icon: "shield" },
  "1019": { primary: "#3E2723", accent: "#FFD700", icon: "star" },
  "1020": { primary: "#1F5C1F", accent: "#8BC34A", icon: "tree" },
  "1021": { primary: "#BF360C", accent: "#FFCC02", icon: "bull" },
  "1022": { primary: "#0D47A1", accent: "#FFEB3B", icon: "bolt" },
  "1023": { primary: "#4A148C", accent: "#B8860B", icon: "wolf" },
  "1024": { primary: "#E65100", accent: "#FFF176", icon: "sun" },
  // Division D
  "1025": { primary: "#8B0000", accent: "#4FC3F7", icon: "wolf" },
  "1026": { primary: "#0D47A1", accent: "#FFFFFF", icon: "peaks" },
  "1027": { primary: "#FF6F00", accent: "#002244", icon: "bolt" },
  "1028": { primary: "#8D6E63", accent: "#FF7043", icon: "storm" },
  "1029": { primary: "#B71C1C", accent: "#FF9800", icon: "flame" },
  "1030": { primary: "#C62828", accent: "#FFFFFF", icon: "mountain" },
  "1031": { primary: "#E65100", accent: "#FFF176", icon: "flame" },
  "1032": { primary: "#0277BD", accent: "#FFCC80", icon: "surge" },
}

export interface Team {
  employee_id: string
  manager_name: string
  district: string
  state: string
  division: string
  conference: string
  seed: number
  tech_count: number
  mascot: string
}

export const TEAMS: Team[] = [
  // Division A (seeds 1–8)
  { employee_id: "1001", manager_name: "Manager 1",  district: "Region A1", state: "State 1",  division: "Conf A", conference: "Conf", seed: 1, tech_count: 17, mascot: "River Hawks" },
  { employee_id: "1002", manager_name: "Manager 2",  district: "Region A2", state: "State 2",  division: "Conf A", conference: "Conf", seed: 2, tech_count: 16, mascot: "Iron Ridge" },
  { employee_id: "1003", manager_name: "Manager 3",  district: "Region A3", state: "State 3",  division: "Conf A", conference: "Conf", seed: 3, tech_count: 15, mascot: "Island Thunder" },
  { employee_id: "1004", manager_name: "Manager 4",  district: "Region A4", state: "State 3",  division: "Conf A", conference: "Conf", seed: 4, tech_count: 14, mascot: "Brooklyn Steel" },
  { employee_id: "1005", manager_name: "Manager 5",  district: "Region A5", state: "State 3",  division: "Conf A", conference: "Conf", seed: 5, tech_count: 14, mascot: "Brownstone Surge" },
  { employee_id: "1006", manager_name: "Manager 6",  district: "Region A6", state: "State 3",  division: "Conf A", conference: "Conf", seed: 6, tech_count: 11, mascot: "Genesee Rampage" },
  { employee_id: "1007", manager_name: "Manager 7",  district: "Region A7", state: "State 4",  division: "Conf A", conference: "Conf", seed: 7, tech_count: 17, mascot: "Piedmont Thunder" },
  { employee_id: "1008", manager_name: "Manager 8",  district: "Region A8", state: "State 4",  division: "Conf A", conference: "Conf", seed: 8, tech_count: 17, mascot: "Cape Fear Tide" },
  // Division B (seeds 1–8)
  { employee_id: "1009", manager_name: "Manager 9",  district: "Region B1", state: "State 5",  division: "Conf B", conference: "Conf", seed: 1, tech_count: 15, mascot: "Lake Erie Wolves" },
  { employee_id: "1010", manager_name: "Manager 10", district: "Region B2", state: "State 6",  division: "Conf B", conference: "Conf", seed: 2, tech_count: 14, mascot: "Chesapeake Storm" },
  { employee_id: "1011", manager_name: "Manager 11", district: "Region B3", state: "State 7",  division: "Conf B", conference: "Conf", seed: 3, tech_count: 14, mascot: "Liberty Steele" },
  { employee_id: "1012", manager_name: "Manager 12", district: "Region B4", state: "State 6",  division: "Conf B", conference: "Conf", seed: 4, tech_count: 13, mascot: "Tidal Force" },
  { employee_id: "1013", manager_name: "Manager 13", district: "Region B5", state: "State 7",  division: "Conf B", conference: "Conf", seed: 5, tech_count: 11, mascot: "Iron City Force" },
  { employee_id: "1014", manager_name: "Manager 14", district: "Region B6", state: "State 5",  division: "Conf B", conference: "Conf", seed: 6, tech_count: 11, mascot: "North Shore Crush" },
  { employee_id: "1015", manager_name: "Manager 15", district: "Region B7", state: "State 8",  division: "Conf B", conference: "Conf", seed: 7, tech_count: 17, mascot: "Windy City Blitz" },
  { employee_id: "1016", manager_name: "Manager 16", district: "Region B8", state: "State 9",  division: "Conf B", conference: "Conf", seed: 8, tech_count: 14, mascot: "Lakefront Thunder" },
  // Division C (seeds 1–8)
  { employee_id: "1017", manager_name: "Manager 17", district: "Region C1", state: "State 10", division: "Conf C", conference: "Conf", seed: 1, tech_count: 29, mascot: "Roughnecks" },
  { employee_id: "1018", manager_name: "Manager 18", district: "Region C2", state: "State 11", division: "Conf C", conference: "Conf", seed: 2, tech_count: 29, mascot: "Raiders" },
  { employee_id: "1019", manager_name: "Manager 19", district: "Region C3", state: "State 11", division: "Conf C", conference: "Conf", seed: 3, tech_count: 20, mascot: "Outlaws" },
  { employee_id: "1020", manager_name: "Manager 20", district: "Region C4", state: "State 11", division: "Conf C", conference: "Conf", seed: 4, tech_count: 18, mascot: "Piney Woods Surge" },
  { employee_id: "1021", manager_name: "Manager 21", district: "Region C5", state: "State 11", division: "Conf C", conference: "Conf", seed: 5, tech_count: 18, mascot: "Stampede" },
  { employee_id: "1022", manager_name: "Manager 22", district: "Region C6", state: "State 11", division: "Conf C", conference: "Conf", seed: 6, tech_count: 18, mascot: "Charge" },
  { employee_id: "1023", manager_name: "Manager 23", district: "Region C7", state: "State 12", division: "Conf C", conference: "Conf", seed: 7, tech_count: 23, mascot: "Bayou Wolves" },
  { employee_id: "1024", manager_name: "Manager 24", district: "Region C8", state: "State 13", division: "Conf C", conference: "Conf", seed: 8, tech_count: 20, mascot: "Sunshine Surge" },
  // Division D (seeds 1–8)
  { employee_id: "1025", manager_name: "Manager 25", district: "Region D1", state: "State 14", division: "Conf D", conference: "Conf", seed: 1, tech_count: 22, mascot: "Gateway Wolves" },
  { employee_id: "1026", manager_name: "Manager 26", district: "Region D2", state: "State 15", division: "Conf D", conference: "Conf", seed: 2, tech_count: 18, mascot: "Pikes Peak Eagles" },
  { employee_id: "1027", manager_name: "Manager 27", district: "Region D3", state: "State 15", division: "Conf D", conference: "Conf", seed: 3, tech_count: 15, mascot: "Mile High Blitz" },
  { employee_id: "1028", manager_name: "Manager 28", district: "Region D4", state: "State 16", division: "Conf D", conference: "Conf", seed: 4, tech_count: 14, mascot: "Desert Storm" },
  { employee_id: "1029", manager_name: "Manager 29", district: "Region D5", state: "State 16", division: "Conf D", conference: "Conf", seed: 5, tech_count: 11, mascot: "Phoenix Inferno" },
  { employee_id: "1030", manager_name: "Manager 30", district: "Region D6", state: "State 17", division: "Conf D", conference: "Conf", seed: 6, tech_count:  8, mascot: "Wasatch Warriors" },
  { employee_id: "1031", manager_name: "Manager 31", district: "Region D7", state: "State 18", division: "Conf D", conference: "Conf", seed: 7, tech_count: 27, mascot: "Valley Heat" },
  { employee_id: "1032", manager_name: "Manager 32", district: "Region D8", state: "State 18", division: "Conf D", conference: "Conf", seed: 8, tech_count: 23, mascot: "High Desert Surge" },
]

export const DIVISIONS = ["A", "B", "C", "D"] as const
export const CONFERENCES = ["Conf"] as const

export function getTeamsByDivision(conference: string, division: string): Team[] {
  const divKey = `${conference} ${division}`
  return TEAMS.filter(t => t.division === divKey).sort((a, b) => a.seed - b.seed)
}

export function getTeamById(employeeId: string): Team | undefined {
  return TEAMS.find(t => t.employee_id === employeeId)
}

/**
 * Berger round-robin matchups for a given week.
 * Fixes seed-1 team, rotates the rest. Produces n/2 pairs per round.
 */
export function getWeekMatchups(teams: Team[], weekNum: number): [Team, Team][] {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed)
  const n = sorted.length
  const rot = [...sorted]
  const rounds = (weekNum - 1) % (n - 1)
  for (let r = 0; r < rounds; r++) {
    rot.splice(1, 0, rot.pop()!)
  }
  const pairs: [Team, Team][] = []
  for (let i = 0; i < n / 2; i++) {
    pairs.push([rot[i], rot[n - 1 - i]])
  }
  return pairs
}

export function renderLogoSvg(employeeId: string, size = 40): string {
  const cfg = TEAM_LOGOS[employeeId] ?? { primary: "#374151", accent: "#9CA3AF", icon: "bolt" as const }
  const iconD = ICON_PATHS[cfg.icon] ?? ICON_PATHS.bolt
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20,2 L38,9 L38,29 Q20,40 20,40 Q2,29 2,29 L2,9 Z" fill="${cfg.primary}" stroke="${cfg.accent}" stroke-width="1.5"/><path d="${iconD}" fill="${cfg.accent}"/></svg>`
}

export const DIVISION_COLORS: Record<string, { primary: string; light: string }> = {
  "Conf A": { primary: "#002244", light: "#4488cc" },
  "Conf B": { primary: "#241773", light: "#8888cc" },
  "Conf C": { primary: "#03202F", light: "#3399bb" },
  "Conf D": { primary: "#E31837", light: "#ff5577" },
}
