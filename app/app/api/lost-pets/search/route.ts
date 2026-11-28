/* GET /api/lost-pets/search?q=ginger cat Arroios&status=found → matching reports (newest and closest first). */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { reportJson, searchReports } from "@/lib/lost-pets/query"

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams
  const origin = siteOrigin(request)
  const limit = Math.min(50, Math.max(1, Number(p.get("limit")) || 10))
  const results = searchReports(p.get("q") ?? "", { status: p.get("status"), limit }).map((r) => reportJson(r, origin))
  return Response.json({ count: results.length, results }, { headers: { ...CORS, "Cache-Control": "no-store" } })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
