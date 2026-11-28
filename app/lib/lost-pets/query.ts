/* Searching the lost & found pets database (lib/lost-pets/db.ts) — used by the AI connector (/api/mcp),
   the REST API (/api/lost-pets/…) and the /lost-found/reports pages.
   Matching uses the same Lab 01 rule as the app (ruleVerdict in lib/ai/engine.js):
   colour +2 (look-alike +1) · within 2 km +2 · same size +1 · found within 7 days +1 · after 30 days −2 · match ≥ 5, maybe ≥ 2. */

import { RULE, ruleVerdict } from "@/lib/ai/engine"
import { kmBetween } from "@/lib/demo-data"
import { AREAS, REPORTS, type AreaKey, type PetReport, type Size, type Species, type Status } from "@/lib/lost-pets/db"

const DAY = 864e5

/* ---------- understanding what people (or an AI) type, in English, Russian or Portuguese ---------- */

const SPECIES: [Species, RegExp][] = [
  ["dog", /\b(dog|puppy|pup|hound)|собак|пёс|пес\b|щен|\b(cão|cao|cachorro|cadela)/i],
  ["cat", /\b(cat|kitten|kitty)|кош|кот|\b(gato|gata)/i],
  ["bird", /\b(bird|parrot|budgie|cockatiel|lovebird)|птиц|попуга|\b(pássaro|passaro|papagaio|periquito)/i],
  ["rabbit", /\b(rabbit|bunny)|кролик|заяц|\b(coelho)/i],
]
const COLOURS: [string, RegExp][] = [
  ["dark grey", /dark gr[ae]y|тёмно-сер|темно-сер|cinzento escuro/i],
  ["ginger", /ginger|orange|golden|red(dish)?\b|рыж|золот|ruivo|laranja|dourad/i],
  ["black", /black|чёрн|черн|preto|negro/i],
  ["white", /white|бел|branc/i],
  ["cream", /cream|fawn|beige|yellow|light|кремов|бежев|палев|creme|bege/i],
  ["grey", /gr[ae]y|silver|tabby|blue-grey|сер|полосат|cinz|tigrad/i],
  ["brown", /brown|tan|chocolate|коричн|шоколад|castanh|marrom/i],
  ["green", /green|зелён|зелен|verde/i],
]
const SIZES: [Size, RegExp][] = [
  ["small", /small|little|tiny|toy|mini|puppy|kitten|маленьк|мелк|щен|котён|котен|pequen/i],
  ["large", /large|big|huge|giant|крупн|больш|grande/i],
  ["medium", /medium|mid|средн|médi|medi/i],
]

export function toSpecies(v?: string | null): Species | null {
  if (!v) return null
  return SPECIES.find(([, re]) => re.test(v))?.[0] ?? (/^(other|другое|outro)$/i.test(v.trim()) ? "other" : null)
}
export function toColour(v?: string | null): string | null {
  if (!v) return null
  return COLOURS.find(([, re]) => re.test(v))?.[0] ?? null
}
export function toSize(v?: string | null): Size | null {
  if (!v) return null
  return SIZES.find(([, re]) => re.test(v))?.[0] ?? null
}
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
/** A neighbourhood the database knows ("Estrela", "near Jardim da Estrela", "campo de ourique"). */
export function toArea(v?: string | null): AreaKey | null {
  if (!v) return null
  const t = fold(v)
  const keys = Object.keys(AREAS) as AreaKey[]
  return (
    keys.find(
      (k) =>
        t.includes(fold(AREAS[k].name)) ||
        t.includes(k.replace(/-/g, " ")) ||
        AREAS[k].aka.split("|").some((a) => t.includes(fold(a)) || t.includes(fold(a).replace(/-/g, " ")))
    ) ??
    // a landmark from a report ("LX Factory", "Torre de Belém")
    REPORTS.find((r) => t.includes(fold(r.place)))?.area ??
    null
  )
}
/** "today", "yesterday", "3 days ago", "2026-11-25" → days ago (0 = today). */
export function toDaysAgo(v?: string | number | null): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Math.max(0, Math.round(v))
  const t = v.trim().toLowerCase()
  if (/^(today|now|just now|сегодня|сейчас|hoje|agora)/.test(t)) return 0
  if (/^(yesterday|вчера|ontem)/.test(t)) return 1
  if (/позавчера|anteontem|day before yesterday/.test(t)) return 2
  const n = t.match(/(\d+)\s*(day|days|дн|день|дня|dias?)/)
  if (n) return Number(n[1])
  const w = t.match(/(\d+)\s*(week|weeks|недел|semanas?)/)
  if (w) return Number(w[1]) * 7
  if (/last week|a week ago|week ago|на прошлой неделе|неделю назад|неделю|semana passada|uma semana/.test(t)) return 7
  if (/a month ago|month ago|месяц назад|um mês|um mes/.test(t)) return 30
  const d = Date.parse(t)
  if (!Number.isNaN(d)) return Math.max(0, Math.floor((Date.now() - d) / DAY))
  return null
}

/* ---------- presenting a report ---------- */

export const STATUS_LABEL: Record<Status, string> = { found: "Found", sighted: "Sighted", lost: "Lost", reunited: "Reunited" }
export const areaName = (r: PetReport) => `${AREAS[r.area].name}, ${AREAS[r.area].city}`
export const reportDate = (r: PetReport) => {
  const now = Date.now()
  const d = new Date(now - r.daysAgo * DAY)
  d.setHours(r.hour, 0, 0, 0)
  // a "today" report can't be later than now: move it to the last full hour
  if (d.getTime() > now) {
    d.setTime(now - 3600e3)
    d.setMinutes(0, 0, 0)
  }
  return d
}
export const whenText = (r: PetReport) => {
  const h = reportDate(r).getHours()
  return r.daysAgo === 0 ? `today around ${h}:00` : r.daysAgo === 1 ? `yesterday around ${h}:00` : `${r.daysAgo} days ago`
}
export const reportTitle = (r: PetReport) =>
  `${STATUS_LABEL[r.status]}: ${[r.size, r.coat, r.breed ?? r.species].filter(Boolean).join(" ")}${r.name ? ` “${r.name}”` : ""} · ${AREAS[r.area].name}`
export const reportPath = (r: PetReport) => `/lost-found/reports/${r.id}`
/** A PNG for every report: its photo if it has one, else a labelled illustration (species + coat colour). */
export const imagePath = (r: PetReport) => r.photo ?? `/api/pets/${r.id}/image.png`

/** Everything about one report as plain text (what an AI reads). */
export function reportText(r: PetReport) {
  return [
    reportTitle(r),
    `Status: ${STATUS_LABEL[r.status]} (${whenText(r)}, ${reportDate(r).toISOString().slice(0, 10)})`,
    `Animal: ${r.species}${r.breed ? ` · ${r.breed}` : ""} · ${r.size} · ${r.coat}${r.sex ? ` · ${r.sex}` : ""}${r.age ? ` · ${r.age}` : ""}`,
    r.name ? `Name: ${r.name}` : null,
    r.marks ? `Distinctive marks: ${r.marks}` : null,
    r.collar ? `Collar: ${r.collar}` : null,
    r.chip ? `Microchip: ${r.chip}` : null,
    `Where: ${r.place}, ${areaName(r)}`,
    r.now ? `Now: ${r.now}` : null,
    `Description: ${r.description}`,
    `Contact: through the buddy app (demo — no personal details are shared).`,
  ]
    .filter(Boolean)
    .join("\n")
}

/** The public shape of a report (API responses). */
export function reportJson(r: PetReport, origin: string) {
  return {
    id: r.id,
    status: r.status,
    title: reportTitle(r),
    species: r.species,
    breed: r.breed,
    name: r.name,
    colour: r.colour,
    coat: r.coat,
    size: r.size,
    sex: r.sex,
    age: r.age,
    marks: r.marks,
    collar: r.collar,
    microchip: r.chip,
    area: AREAS[r.area].name,
    city: AREAS[r.area].city,
    place: r.place,
    date: reportDate(r).toISOString(),
    when: whenText(r),
    now: r.now,
    description: r.description,
    url: origin + reportPath(r),
    image_url: origin + imagePath(r),
    image_type: r.photo ? "photo" : "illustration",
    location: {
      place: r.place,
      area: AREAS[r.area].name,
      city: AREAS[r.area].city,
      country: "Portugal",
      // the neighbourhood's centre, not the exact spot
      lat: Math.round(AREAS[r.area].ll[0] * 1000) / 1000,
      lng: Math.round(AREAS[r.area].ll[1] * 1000) / 1000,
      precision: "neighbourhood",
    },
  }
}

export const getReport = (id: string) => REPORTS.find((r) => r.id.toLowerCase() === id.trim().toLowerCase()) ?? null

/* ---------- matching a lost pet against found & sighted animals ---------- */

export type LostPetQuery = {
  species: string
  colour?: string | null
  size?: string | null
  area?: string | null
  /** When it went missing: "today", "2 days ago", an ISO date… */
  lost?: string | number | null
  breed?: string | null
  description?: string | null
}

export type Match = {
  report: PetReport
  verdict: "match" | "maybe"
  score: number
  reasons: string[]
  km: number | null
}

export function findMatches(q: LostPetQuery) {
  const text = [q.species, q.colour, q.size, q.breed, q.description].filter(Boolean).join(" ")
  const species = toSpecies(q.species) ?? toSpecies(text)
  const colour = toColour(q.colour) ?? toColour(q.description)
  const size = toSize(q.size) ?? toSize(q.description)
  const area = toArea(q.area) ?? toArea(q.description)
  const lostDaysAgo = toDaysAgo(q.lost) ?? 3 // unknown: assume a few days, so recent finds still count as fresh
  const understood = { species, colour, size, area: area ? AREAS[area].name : null, lostDaysAgo }
  if (!species) return { understood, candidates: 0, matches: [] as Match[] }

  const from = area ? AREAS[area].ll : null
  const lostDay = Date.now() - lostDaysAgo * DAY
  const breedWords = (q.breed ?? "").toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  const pool = REPORTS.filter((r) => (r.status === "found" || r.status === "sighted") && r.species === species)

  const matches = pool
    .map((r): Match | null => {
      const km = from ? Math.round(kmBetween(from, AREAS[r.area].ll) * 10) / 10 : null
      const v = ruleVerdict(
        { sp: species, colour, size, lostDay: new Date(lostDay) },
        { sp: r.species, colour: r.colour, size: r.size, km: km ?? 99, bearing: 0, daysAgo: r.daysAgo, where: r.place, desc: r.description }
      )
      if (v.verdict === "no") return null
      // "comparable" means it looks like the pet or was near where it went missing — not only the same size and fresh
      if (!v.clues.some(([c]) => /colour|from where/i.test(c))) return null
      const reasons = v.clues.map(([c, p]) => `${c} (${p > 0 ? "+" : ""}${p})`)
      if (km != null && km > RULE.NEAR_KM) reasons.push(`${km} km from ${AREAS[area!].name}`)
      if (breedWords.length && r.breed && breedWords.some((w) => r.breed!.toLowerCase().includes(w))) reasons.push(`Breed looks the same: ${r.breed}`)
      return { report: r, verdict: v.verdict, score: v.score, reasons, km }
    })
    .filter((m): m is Match => !!m)
    .sort((a, b) => b.score - a.score || (a.km ?? 99) - (b.km ?? 99) || a.report.daysAgo - b.report.daysAgo)

  return { understood, candidates: pool.length, matches }
}

/** The answer an AI relays: how many comparable animals, best first. */
export function matchesSummary(res: ReturnType<typeof findMatches>, origin: string) {
  const { understood: u, matches } = res
  if (!u.species) return "Tell me which animal it is (dog, cat, bird, rabbit…) and I'll compare it with the found and sighted animals on buddy."
  const strong = matches.filter((m) => m.verdict === "match").length
  const lostWhat = [u.size, u.colour, u.species].filter(Boolean).join(" ")
  const head =
    matches.length === 0
      ? `No found or sighted animals on buddy are comparable to your ${lostWhat} yet (checked ${res.candidates} ${u.species} reports${u.area ? ` around ${u.area}` : ""}). Report it on buddy so finders nearby can match it: ${origin}/lost-found/lost/report`
      : `${matches.length} animal${matches.length > 1 ? "s" : ""} on buddy ${matches.length > 1 ? "are" : "is"} comparable to your ${lostWhat}${u.area ? ` lost around ${u.area}` : ""}: ${strong} strong match${strong === 1 ? "" : "es"}, ${matches.length - strong} possible (out of ${res.candidates} found or sighted ${u.species} reports).`
  const lines = matches.map(
    (m, i) =>
      `${i + 1}. [${m.verdict === "match" ? "Strong match" : "Possible"} · ${m.score} pts] ${reportTitle(m.report)} — ${STATUS_LABEL[m.report.status].toLowerCase()} ${whenText(m.report)} at ${m.report.place}. ${m.report.description}${m.report.marks ? ` Marks: ${m.report.marks}.` : ""} Why: ${m.reasons.join("; ")}. ${origin}${reportPath(m.report)}`
  )
  return [head, ...lines].join("\n")
}

/* ---------- free-text search over all reports ---------- */

export function searchReports(query: string, opts: { status?: string | null; limit?: number } = {}) {
  const species = toSpecies(query)
  const colour = toColour(query)
  const size = toSize(query)
  const area = toArea(query)
  const status = (["found", "sighted", "lost", "reunited"] as const).find((s) => s === opts.status) ?? null
  const words = fold(query)
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((w) => w.length > 2)
  const scored = REPORTS.filter((r) => !status || r.status === status)
    .map((r) => {
      if (species && r.species !== species) return null
      const hay = fold([r.id, r.breed, r.name, r.coat, r.marks, r.collar, r.place, AREAS[r.area].name, r.description].join(" "))
      let s = 0
      if (species) s += 3
      if (colour && r.colour === colour) s += 2
      if (size && r.size === size) s += 1
      if (area && r.area === area) s += 3
      for (const w of words) if (hay.includes(w)) s += 1
      return s > 0 || (!query.trim() && true) ? { r, s } : null
    })
    .filter((x): x is { r: PetReport; s: number } => !!x)
    .sort((a, b) => b.s - a.s || a.r.daysAgo - b.r.daysAgo)
  return scored.slice(0, opts.limit ?? 10).map((x) => x.r)
}

/** For the report pages: newest first, optionally one status. */
export const listReports = (status?: Status | null) => REPORTS.filter((r) => !status || r.status === status).sort((a, b) => a.daysAgo - b.daysAgo || b.hour - a.hour)
