// GET /api/roster — returns the resolved logo/color map for the active roster
// (real Airtable roster when DATA_SOURCE=airtable, static placeholders otherwise).
import { getRoster } from "@/lib/roster"
import { resolveLogos } from "@/lib/logo-resolver"

export const dynamic = "force-dynamic"

export async function GET() {
  const teams = await getRoster()
  const logoMap = resolveLogos(teams)
  return Response.json({ logoMap })
}
