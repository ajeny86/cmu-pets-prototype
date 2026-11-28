/* GET /api/lost-pets/F-2101 → one report in full. */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { getReport, reportJson, reportText } from "@/lib/lost-pets/query"

export async function GET(request: Request, ctx: RouteContext<"/api/lost-pets/[id]">) {
  const { id } = await ctx.params
  const r = getReport(decodeURIComponent(id))
  if (!r) return Response.json({ error: `No report with id ${id}` }, { status: 404, headers: CORS })
  return Response.json({ ...reportJson(r, siteOrigin(request)), text: reportText(r) }, { headers: { ...CORS, "Cache-Control": "no-store" } })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
