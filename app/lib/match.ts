/* Lost ↔ found matching: the Lab 01 rule (engine.js) run over the demo found reports
   plus found reports made on this device, so a found → lost test works on one phone. */

import { atBearing, bindReport, ruleVerdict, type DemoFound, type LatLng, type SearchResult } from "@/lib/ai/engine"
import type { LostDraft } from "@/lib/ai/story"
import { kmBetween } from "@/lib/demo-data"
import type { FoundReport } from "@/lib/store"

const bearing = (a: LatLng, b: LatLng) => {
  const r = Math.PI / 180
  const y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r)
  const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r)
  return ((Math.atan2(y, x) / r) + 360) % 360
}

const COLOURS = ["dark grey", "black", "white", "cream", "grey", "brown", "ginger", "green"]
const baseColour = (c: string | null | undefined) => {
  const v = (c || "").toLowerCase()
  if (/tabby/.test(v)) return "grey"
  if (/golden/.test(v)) return "ginger"
  if (/dark brown/.test(v)) return "brown"
  return COLOURS.find((x) => v.includes(x)) ?? v
}

/** A found report made on this device, in the rule's words. */
export function localToDemo(r: FoundReport, from: LatLng): (DemoFound & { localId: string; ll: LatLng }) | null {
  const kind = (r.reading?.kind || r.animal.split(/[\s·,]/)[0] || "").toLowerCase()
  if (!kind || !r.spotLL) return null
  const text = `${r.animal} ${r.notes}`.toLowerCase()
  return {
    localId: r.id,
    ll: r.spotLL,
    sp: kind,
    colour: baseColour(r.reading?.colour || text),
    size: /\b(small|little|tiny|kitten|puppy)\b/.test(text) ? "small" : /\b(large|big)\b/.test(text) ? "large" : "medium",
    km: Math.round(kmBetween(from, r.spotLL) * 10) / 10,
    bearing: bearing(from, r.spotLL),
    daysAgo: Math.floor((Date.now() - r.createdAt) / 864e5),
    where: r.spot || "Reported on this device",
    desc: [r.animal || kind, r.reading?.colour].filter(Boolean).join(" · "),
  }
}

export type MatchResult = SearchResult & { ll?: LatLng; localId?: string; photo?: string | null }

/** Best found report for this lost pet: demo reports + this device's found reports. */
export function findMatch(draft: LostDraft, center: LatLng, local: FoundReport[]): MatchResult | null {
  const S = structuredClone(draft)
  const demo = bindReport(S).searchFound()
  const lost = bindReport(S).lostForRule()
  const mine = local
    .map((r) => ({ r, f: localToDemo(r, draft.lostPin ?? center) }))
    .filter((x): x is { r: FoundReport; f: NonNullable<ReturnType<typeof localToDemo>> } => !!x.f)
    .map(({ r, f }) => ({ f, lost, desc: f.desc, ll: f.ll, localId: f.localId, photo: r.photo, ...ruleVerdict(lost, f) }))
    .filter((x) => x.verdict !== "no")
  const all: MatchResult[] = [...mine, ...(demo ? [demo] : [])]
  all.sort((a, b) => b.score - a.score || a.f.km - b.f.km)
  return all[0] ?? null
}

export const foundLL = (m: MatchResult, center: LatLng): LatLng => m.ll ?? atBearing(center, m.f.km, m.f.bearing)

/** Sightings of a pet nobody could catch (prototype seenData): three points moving away, newest last. */
export function sightings(base: LatLng) {
  const now = Date.now()
  const ago = [130, 70, 25]
  const pts: LatLng[] = [
    [base[0] + 0.0045, base[1] + 0.003],
    [base[0] + 0.0075, base[1] + 0.0075],
    [base[0] + 0.0095, base[1] + 0.0115],
  ]
  const mins = ago[2]
  return { base, pts, times: ago.map((a) => new Date(now - a * 60000)), mins, radius: Math.min(1000, 300 + mins * 12) }
}
