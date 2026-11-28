/* GET /api/lost-pets/matches?species=dog&colour=brown&size=small&area=Estrela&lost=today
   → how many found & sighted animals are comparable to a lost pet, best first (for GPT Actions and other tools). */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { findMatches, matchesSummary, reportJson } from "@/lib/lost-pets/query"

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams
  const species = p.get("species")
  if (!species) return Response.json({ error: "Pass ?species= (dog, cat, bird, rabbit or other)" }, { status: 400, headers: CORS })
  const origin = siteOrigin(request)
  const res = findMatches({
    species,
    colour: p.get("colour"),
    size: p.get("size"),
    area: p.get("area"),
    lost: p.get("lost"),
    breed: p.get("breed"),
    description: p.get("description"),
  })
  return Response.json(
    {
      summary: matchesSummary(res, origin),
      understood: res.understood,
      checked: res.candidates,
      count: res.matches.length,
      strong: res.matches.filter((m) => m.verdict === "match").length,
      matches: res.matches.map((m) => ({ ...reportJson(m.report, origin), verdict: m.verdict, score: m.score, reasons: m.reasons, km: m.km })),
      report_your_pet: `${origin}/lost-found/lost/report`,
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } }
  )
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
