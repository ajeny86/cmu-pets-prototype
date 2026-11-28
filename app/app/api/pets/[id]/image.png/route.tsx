/* GET /api/pets/F-2101/image.png → a PNG for a listing without a photo: species + coat colour,
   clearly labelled as an illustration (the demo database has no real photos). */

import { ImageResponse } from "next/og"

import { AREAS } from "@/lib/lost-pets/db"
import { STATUS_LABEL, getReport } from "@/lib/lost-pets/query"

const COAT: Record<string, string> = {
  black: "#26262b",
  white: "#f4f4f2",
  cream: "#ead2a0",
  grey: "#9aa1a9",
  "dark grey": "#575d64",
  brown: "#8a5a2e",
  ginger: "#d9822b",
  green: "#47a84f",
}
const EMOJI: Record<string, string> = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐇", other: "🐾" }
const STATUS_BG: Record<string, string> = { found: "#10288b", sighted: "#5b4bc4", lost: "#e0459a", reunited: "#05a74a" }

export async function GET(_request: Request, ctx: RouteContext<"/api/pets/[id]/image.png">) {
  const { id } = await ctx.params
  const r = getReport(decodeURIComponent(id))
  if (!r) return new Response("Not found", { status: 404 })
  const coat = COAT[r.colour] ?? "#c9ced8"
  const dark = ["black", "dark grey", "brown", "green"].includes(r.colour)
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f2f4fb", fontFamily: "sans-serif", color: "#10288b" }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", background: coat, position: "relative" }}>
          <div style={{ display: "flex", fontSize: 230 }}>{EMOJI[r.species] ?? "🐾"}</div>
          <div style={{ position: "absolute", top: 24, left: 24, display: "flex", padding: "8px 18px", borderRadius: 999, background: STATUS_BG[r.status], color: "white", fontSize: 28, fontWeight: 700 }}>
            {STATUS_LABEL[r.status]} · {r.id}
          </div>
          <div style={{ position: "absolute", top: 24, right: 24, display: "flex", padding: "8px 16px", borderRadius: 999, background: "rgba(255,255,255,0.9)", color: "#10288b", fontSize: 22 }}>
            Demo illustration — not a photo
          </div>
          <div style={{ position: "absolute", bottom: 20, right: 24, display: "flex", fontSize: 22, color: dark ? "rgba(255,255,255,0.85)" : "rgba(16,40,139,0.75)" }}>
            Coat: {r.coat}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 28px", gap: 6, background: "white" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            {[r.size, r.breed ?? r.species].join(" ")}
            {r.name ? ` “${r.name}”` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#5a6390" }}>
            {r.place}, {AREAS[r.area].name}, {AREAS[r.area].city}
            {r.marks ? ` · ${r.marks}` : ""}
          </div>
        </div>
      </div>
    ),
    { width: 800, height: 600, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400", "Access-Control-Allow-Origin": "*" } }
  )
}
