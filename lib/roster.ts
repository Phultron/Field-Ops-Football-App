/**
 * Roster fetch — returns the team roster (employee_id, manager_name, district, etc.).
 *
 * Default: the static placeholder roster from lib/teams.ts (unchanged public behavior).
 * When DATA_SOURCE=airtable: fetches the real roster from a pre-synced Airtable
 * table (see scripts/sync-gridiron-to-airtable.ts), cached briefly in-memory.
 */

import { TEAMS, type Team } from "./teams"

interface AirtableRosterRecord {
  fields: {
    EMPLOYEE_ID?: number
    MANAGER_NAME?: string
    DISTRICT?: string
    STATE?: string
    DIVISION?: string
    CONFERENCE?: string
    SEED?: number
    TECH_COUNT?: number
    MASCOT?: string
  }
}

const CACHE_TTL_MS = 60_000
let cache: { teams: Team[]; fetchedAt: number } | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Airtable data source requires the ${name} env var.`)
  }
  return value
}

async function fetchAllRosterRecords(): Promise<AirtableRosterRecord[]> {
  const apiKey = requireEnv("AIRTABLE_API_KEY")
  const baseId = requireEnv("AIRTABLE_BASE_ID")
  const table = process.env.AIRTABLE_ROSTER_TABLE ?? "ROSTER"

  const records: AirtableRosterRecord[] = []
  let offset: string | undefined
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`)
    url.searchParams.set("pageSize", "100")
    if (offset) url.searchParams.set("offset", offset)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(`Airtable list records failed: ${res.status} ${res.statusText} ${detail.slice(0, 300)}`)
    }
    const json = (await res.json()) as { records: AirtableRosterRecord[]; offset?: string }
    records.push(...json.records)
    offset = json.offset
  } while (offset)

  return records
}

async function fetchAirtableRoster(): Promise<Team[]> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.teams

  const records = await fetchAllRosterRecords()
  const teams: Team[] = records.map((r) => ({
    employee_id: String(r.fields.EMPLOYEE_ID ?? ""),
    manager_name: r.fields.MANAGER_NAME ?? "",
    district: r.fields.DISTRICT ?? "",
    state: r.fields.STATE ?? "",
    division: r.fields.DIVISION ?? "",
    conference: r.fields.CONFERENCE ?? "",
    seed: Number(r.fields.SEED ?? 0),
    tech_count: Number(r.fields.TECH_COUNT ?? 0),
    mascot: r.fields.MASCOT ?? "",
  }))
  cache = { teams, fetchedAt: now }
  return teams
}

/** Returns the active roster: static placeholders by default, real Airtable data when DATA_SOURCE=airtable. */
export async function getRoster(): Promise<Team[]> {
  if (process.env.DATA_SOURCE === "airtable") {
    return fetchAirtableRoster()
  }
  return TEAMS
}

/** Clears the in-memory roster cache — useful right after running the sync script. */
export function clearRosterCache(): void {
  cache = null
}
