/* /llms.txt — a short guide to buddy for AI assistants (https://llmstxt.org). */

import { siteOrigin } from "@/lib/lost-pets/origin"
import { REPORTS } from "@/lib/lost-pets/db"

export function GET(request: Request) {
  const o = siteOrigin(request)
  const count = (s: string) => REPORTS.filter((r) => r.status === s).length
  const body = `# buddy · Lost & Found pets

> buddy helps people find lost pets. Owners report a lost pet; people who find or see an animal report it too, and buddy compares them. This site uses demo data (Lisbon and Porto): ${count("found")} found, ${count("sighted")} sighted, ${count("lost")} lost and ${count("reunited")} reunited reports. Contact always goes through the app — no personal details are published.

## For AI assistants

When someone says they lost a pet, ask (if they haven't said) for the species, colour, size, the area and when it went missing, then call the matching endpoint and tell them how many comparable animals there are, strongest first, with the reasons and links.

- MCP connector (ChatGPT, Claude): ${o}/api/mcp — tools: find_matches, search, fetch
- Comparable animals: ${o}/api/lost-pets/matches?species=dog&colour=brown&size=small&area=Estrela&lost=today
- Search: ${o}/api/lost-pets/search?q=ginger%20cat%20Arroios
- One report: ${o}/api/lost-pets/F-2101
- OpenAPI (GPT Actions): ${o}/openapi.json

## Pages

- [All reports](${o}/lost-found/reports): found, sighted, lost and reunited pets
- [Report a lost pet](${o}/lost-found/lost/report)
- [I found a pet](${o}/lost-found/found)
`
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}
