/* OpenAPI description of the lost & found API — paste <site>/openapi.json into a custom GPT's Actions ("Import from URL"). */

import { CORS, siteOrigin } from "@/lib/lost-pets/origin"

const str = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra })

export function GET(request: Request) {
  const origin = siteOrigin(request)
  const report = {
    type: "object",
    properties: {
      id: str("Report id, e.g. F-2101"),
      status: str("found, sighted, lost or reunited"),
      title: str("One-line summary"),
      species: str("dog, cat, bird, rabbit, other"),
      breed: { type: ["string", "null"] },
      name: { type: ["string", "null"] },
      colour: str("Base colour used for matching"),
      coat: str("Colour as described"),
      size: str("small, medium or large"),
      marks: { type: ["string", "null"] },
      collar: { type: ["string", "null"] },
      microchip: { type: ["string", "null"] },
      area: str("Neighbourhood"),
      city: str("City"),
      place: str("Landmark"),
      date: str("When it was found / seen / lost (ISO)"),
      when: str("The same, in words"),
      now: { type: ["string", "null"], description: "Where the animal is now" },
      description: str("What the reporter wrote"),
      url: str("Link to the report on buddy"),
    },
  }
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "buddy · Lost & Found pets",
      version: "1.0.0",
      description:
        "Search buddy's lost & found pet reports (demo data, Lisbon and Porto). When someone lost a pet, call findMatches and tell them how many comparable animals there are, the strongest first, with the reasons and links. Contact always goes through the buddy app.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/lost-pets/matches": {
        get: {
          operationId: "findMatches",
          summary: "Animals comparable to a lost pet",
          description: "Compares a lost pet with every found and sighted animal and returns how many are comparable, best first, with reasons and links.",
          parameters: [
            { name: "species", in: "query", required: true, schema: str("dog, cat, bird, rabbit or other") },
            { name: "colour", in: "query", schema: str("Main colour: brown, black, white, cream, grey, ginger…") },
            { name: "size", in: "query", schema: { type: "string", enum: ["small", "medium", "large"] } },
            { name: "area", in: "query", schema: str("Neighbourhood or landmark where it went missing, e.g. Estrela, Alfama, Belém, Arroios, Ribeira") },
            { name: "lost", in: "query", schema: str("When it went missing: today, yesterday, '3 days ago' or YYYY-MM-DD") },
            { name: "breed", in: "query", schema: str("Breed, if known") },
            { name: "description", in: "query", schema: str("Marks, collar, character") },
          ],
          responses: {
            "200": {
              description: "Comparable animals",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      summary: str("A ready-to-read answer: how many comparable animals and the list"),
                      count: { type: "integer" },
                      strong: { type: "integer", description: "How many are strong matches" },
                      checked: { type: "integer", description: "How many found/sighted reports of that species were compared" },
                      matches: {
                        type: "array",
                        items: {
                          allOf: [
                            report,
                            {
                              type: "object",
                              properties: {
                                verdict: str("match (strong) or maybe (possible)"),
                                score: { type: "integer" },
                                reasons: { type: "array", items: { type: "string" } },
                                km: { type: ["number", "null"] },
                              },
                            },
                          ],
                        },
                      },
                      report_your_pet: str("Where to report the lost pet on buddy"),
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/lost-pets/search": {
        get: {
          operationId: "searchReports",
          summary: "Search all reports",
          parameters: [
            { name: "q", in: "query", required: true, schema: str("Free text: animal, colour, breed, area, landmark or id") },
            { name: "status", in: "query", schema: { type: "string", enum: ["found", "sighted", "lost", "reunited"] } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          ],
          responses: {
            "200": {
              description: "Matching reports",
              content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" }, results: { type: "array", items: report } } } } },
            },
          },
        },
      },
      "/api/lost-pets/{id}": {
        get: {
          operationId: "getReport",
          summary: "One report in full",
          parameters: [{ name: "id", in: "path", required: true, schema: str("e.g. F-2101") }],
          responses: {
            "200": { description: "The report", content: { "application/json": { schema: { allOf: [report, { type: "object", properties: { text: str("Full text") } }] } } } },
            "404": { description: "No such report" },
          },
        },
      },
    },
  }
  return Response.json(spec, { headers: { ...CORS, "Cache-Control": "no-store" } })
}
