/* buddy's AI connector: a Model Context Protocol server (stateless Streamable HTTP, JSON responses).
   Add <site>/api/mcp as a connector in ChatGPT (Settings → Connectors / developer mode) or Claude
   (Settings → Connectors → Add custom connector; Claude Code: `claude mcp add --transport http buddy <site>/api/mcp`).
   Tools (read-only, demo data):
     find_matches — "I lost my dog…" → how many found/sighted animals are comparable, best first
     search       — free-text search over all reports (ChatGPT search/fetch shape)
     fetch        — one report in full */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"
import { findMatches, getReport, matchesSummary, reportJson, reportText, reportTitle, searchReports, type LostPetQuery } from "@/lib/lost-pets/query"
import { REPORTS } from "@/lib/lost-pets/db"

const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
const SERVER = { name: "buddy-lost-pets", title: "buddy · Lost & Found pets", version: "1.0.0" }
const INSTRUCTIONS =
  "buddy is a lost & found pets app (demo data, Lisbon and Porto). When someone says they lost a pet, ask for species, colour, size, the area and when it went missing if they haven't said, then call find_matches and tell them how many comparable animals there are, the best ones first, with the reasons and links. Use search/fetch for other questions about reports. Contact always goes through the buddy app; never invent phone numbers or addresses."

type Json = Record<string, unknown>
type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Json }

const TOOLS = [
  {
    name: "find_matches",
    title: "Find animals matching a lost pet",
    description:
      "Compare a lost pet with every found and sighted animal on buddy and return how many are comparable, best first, with the reasons (colour, distance, size, how recent) and a link to each report. Use when someone says they lost their pet. Pass values in English if you can (other languages are understood too).",
    inputSchema: {
      type: "object",
      properties: {
        species: { type: "string", description: "dog, cat, bird, rabbit or other" },
        colour: { type: "string", description: "Main colour, e.g. brown, black, white, cream, grey, ginger" },
        size: { type: "string", enum: ["small", "medium", "large"] },
        area: { type: "string", description: "Neighbourhood or landmark where it went missing, e.g. Estrela, Campo de Ourique, Alfama, Belém, Arroios (Lisbon) or Ribeira, Boavista (Porto)" },
        lost: { type: "string", description: "When it went missing: today, yesterday, '3 days ago' or a date (YYYY-MM-DD)" },
        breed: { type: "string" },
        description: { type: "string", description: "Anything else: marks, collar, character" },
      },
      required: ["species"],
      additionalProperties: false,
    },
    annotations: { title: "Find matches", readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "search",
    title: "Search lost & found reports",
    description:
      "Search all buddy reports (found, sighted, lost and reunited pets) by free text: animal, colour, breed, area, landmark or report id. Returns ids, titles and links; use fetch for the full report.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "e.g. 'small brown dog Estrela', 'ginger cat', 'F-2101'" },
        status: { type: "string", enum: ["found", "sighted", "lost", "reunited"], description: "Only this kind of report" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { title: "Search reports", readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "fetch",
    title: "Get one report",
    description: "The full text of one buddy report by id (from search or find_matches), with its link.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Report id, e.g. F-2101" } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { title: "Get report", readOnlyHint: true, openWorldHint: false },
  },
]

const text = (t: string, structured?: Json, isError = false) => ({
  content: [{ type: "text", text: t }],
  ...(structured ? { structuredContent: structured } : {}),
  ...(isError ? { isError: true } : {}),
})

function callTool(name: string, args: Json, origin: string) {
  if (name === "find_matches") {
    const res = findMatches(args as unknown as LostPetQuery)
    const matches = res.matches.map((m) => ({ ...reportJson(m.report, origin), verdict: m.verdict, score: m.score, reasons: m.reasons, km: m.km }))
    return text(matchesSummary(res, origin), { understood: res.understood, checked: res.candidates, count: matches.length, matches })
  }
  if (name === "search") {
    const results = searchReports(String(args.query ?? ""), { status: args.status as string | undefined }).map((r) => ({
      id: r.id,
      title: reportTitle(r),
      url: `${origin}/lost-found/reports/${r.id}`,
    }))
    // ChatGPT's search/fetch shape: the JSON as text
    return text(JSON.stringify({ results }), { results })
  }
  if (name === "fetch") {
    const r = getReport(String(args.id ?? ""))
    if (!r) return text(`No report with id ${String(args.id)}. Ids look like F-2101, S-3101, L-4101.`, undefined, true)
    const doc = { id: r.id, title: reportTitle(r), text: reportText(r), url: `${origin}/lost-found/reports/${r.id}`, metadata: reportJson(r, origin) }
    return text(JSON.stringify(doc), doc)
  }
  return null
}

function handle(msg: RpcRequest, origin: string): Json | null {
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id ?? null, result })
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } })
  if (msg?.jsonrpc !== "2.0" || typeof msg.method !== "string") return fail(-32600, "Invalid request")
  if (msg.id === undefined) return null // a notification (e.g. notifications/initialized): nothing to answer

  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "")
      return reply({
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
        instructions: `${INSTRUCTIONS} The database has ${REPORTS.length} reports.`,
      })
    }
    case "ping":
      return reply({})
    case "tools/list":
      return reply({ tools: TOOLS })
    case "tools/call": {
      const name = String(msg.params?.name ?? "")
      const out = callTool(name, (msg.params?.arguments as Json) ?? {}, origin)
      return out ? reply(out) : fail(-32602, `Unknown tool: ${name}`)
    }
    case "resources/list":
      return reply({ resources: [] })
    case "prompts/list":
      return reply({ prompts: [] })
    default:
      return fail(-32601, `Method not found: ${msg.method}`)
  }
}

export async function POST(request: Request) {
  let body: RpcRequest | RpcRequest[]
  try {
    body = await request.json()
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS })
  }
  const origin = siteOrigin(request)
  const out = Array.isArray(body) ? body.map((m) => handle(m, origin)).filter(Boolean) : handle(body, origin)
  if (!out || (Array.isArray(out) && !out.length)) return new Response(null, { status: 202, headers: CORS })
  return Response.json(out, { headers: { ...CORS, "Cache-Control": "no-store" } })
}

/* Stateless server: no event stream to open and no session to end. */
export function GET() {
  return new Response("This MCP endpoint takes JSON-RPC over POST.", { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } })
}
export function DELETE() {
  return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } })
}
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
