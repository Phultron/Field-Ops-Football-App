/**
 * Airtable-backed metrics fetch — reads a pre-synced field-metrics table instead of
 * querying Snowflake directly. Populate the table with scripts/sync-gridiron-to-airtable.ts.
 *
 * Activated when DATA_SOURCE=airtable (see lib/live-scoring.ts).
 *
 * Env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_METRICS_TABLE
 */

interface AirtableMetricsRecord {
  fields: {
    EMPLOYEE_ID?: number
    SCORE_DATE?: string
    REFERRALS?: number
    UPSELL_PCT?: number
    VPP?: number
  }
}

interface NormalizedRow {
  employee_id: string
  score_date: string
  referrals: number
  upsell_pct: number
  vpp: number
}

const CACHE_TTL_MS = 60_000 // avoid re-fetching the whole table on every request
let cache: { rows: NormalizedRow[]; fetchedAt: number } | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Airtable data source requires the ${name} env var.`)
  }
  return value
}

async function fetchAllMetricRecords(): Promise<AirtableMetricsRecord[]> {
  const apiKey = requireEnv("AIRTABLE_API_KEY")
  const baseId = requireEnv("AIRTABLE_BASE_ID")
  const table = process.env.AIRTABLE_METRICS_TABLE ?? "DAILY_METRICS"

  const records: AirtableMetricsRecord[] = []
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
    const json = (await res.json()) as { records: AirtableMetricsRecord[]; offset?: string }
    records.push(...json.records)
    offset = json.offset
  } while (offset)

  return records
}

async function getCachedRows(): Promise<NormalizedRow[]> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.rows

  const records = await fetchAllMetricRecords()
  const rows: NormalizedRow[] = records.map((r) => ({
    employee_id: String(r.fields.EMPLOYEE_ID ?? ""),
    score_date: String(r.fields.SCORE_DATE ?? ""),
    referrals: Number(r.fields.REFERRALS ?? 0),
    upsell_pct: Number(r.fields.UPSELL_PCT ?? 0),
    vpp: Number(r.fields.VPP ?? 0),
  }))
  cache = { rows, fetchedAt: now }
  return rows
}

/**
 * Returns rows shaped exactly like the Snowflake query result in lib/live-scoring.ts:
 * { employee_id, score_date, referrals, upsell_pct, vpp } filtered to the given
 * manager IDs and dates.
 */
export async function fetchAirtableRows(
  managerIds: number[],
  dates: string[],
): Promise<Record<string, any>[]> {
  const idSet = new Set(managerIds.map(String))
  const dateSet = new Set(dates)
  const rows = await getCachedRows()
  return rows.filter((r) => idSet.has(r.employee_id) && dateSet.has(r.score_date))
}

/** Clears the in-memory cache — useful right after running the sync script. */
export function clearAirtableMetricsCache(): void {
  cache = null
}
