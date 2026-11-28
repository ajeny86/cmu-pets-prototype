/* GET /api/pets/F-2101 → one public listing (read-only, demo data, no contact details). */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { getReport, reportJson, reportText } from "@/lib/lost-pets/query"

export async function GET(request: Request, ctx: RouteContext<"/api/pets/[id]">) {
  const { id } = await ctx.params
  const r = getReport(decodeURIComponent(id))
  if (!r) return Response.json({ error: `No listing with id ${id}. Ids look like F-2101, S-3101, L-4101, R-5101.` }, { status: 404, headers: CORS })
  return Response.json(
    { ...reportJson(r, siteOrigin(request)), text: reportText(r) },
    { headers: { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } }
  )
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
