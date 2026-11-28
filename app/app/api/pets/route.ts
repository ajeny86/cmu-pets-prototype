/* Public, read-only JSON of buddy's lost & found pet listings — for AI agents (ChatGPT, Claude…) and other sites.
   GET /api/pets                     every listing, newest first
   GET /api/pets?status=found        found | sighted | lost | reunited
   GET /api/pets?species=dog         dog | cat | bird | rabbit | other
   GET /api/pets?q=brown+dachshund   free text (colour, breed, area, landmark, id)
   Demo data only. No contact details, accounts or keys: contact always goes through the app. */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { listReports, reportJson, searchReports, toSpecies } from "@/lib/lost-pets/query"
import type { Status } from "@/lib/lost-pets/db"

const STATUSES = ["found", "sighted", "lost", "reunited"] as const

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams
  const origin = siteOrigin(request)
  const status = STATUSES.find((s) => s === p.get("status")) ?? null
  const species = toSpecies(p.get("species"))
  const q = p.get("q")?.trim() ?? ""
  const limit = Math.min(100, Math.max(1, Number(p.get("limit")) || 100))

  const found = (q ? searchReports(q, { status, limit: 100 }) : listReports(status as Status | null))
    .filter((r) => !species || r.species === species)
    .slice(0, limit)

  return Response.json(
    {
      source: "buddy · Lost & Found (demo data)",
      generated_at: new Date().toISOString(),
      count: found.length,
      filters: { status, species, q: q || null },
      statuses: {
        found: "Someone has the animal and is looking for its owner",
        sighted: "The animal was seen but not caught",
        lost: "An owner is looking for their pet",
        reunited: "Case closed — the pet is back home",
      },
      notes:
        "image_type 'illustration' is a generated picture of the species and coat colour, not a photo. Locations are the neighbourhood centre, not an exact address. To contact a finder or owner, open the listing url — buddy passes messages on, no personal details are published.",
      more: { one_listing: `${origin}/api/pets/{id}`, match_a_lost_pet: `${origin}/api/lost-pets/matches?species=dog&colour=brown&area=Estrela&lost=today`, mcp: `${origin}/api/mcp`, openapi: `${origin}/openapi.json` },
      listings: found.map((r) => reportJson(r, origin)),
    },
    { headers: { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } }
  )
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
