// Types for ./engine.js (the logic ported from the single-file prototype).

export type FieldKey = "species" | "name" | "traits" | "city" | "lost" | "time" | "chip" | "home" | "contact"
export type FieldStatus = "missing" | "optional" | "check" | "ok"
export type LatLng = [number, number]

export interface Field {
  k: FieldKey
  label: string
  v: string
  s: FieldStatus
  req?: boolean
  fromPhoto?: boolean
  chip?: string | null
  date?: string | null
  part?: string | null
  exact?: string | null
}

/** The lost-report draft the parser reads and fills (the prototype's `S`). */
export interface ReportState {
  fields: Field[]
  transcript: string
  pet: string
  species: string | null
  saidPlace: string | null
  place?: string | null
  skipped: string[]
  lostPhoto: string | null
  photoNote: string | null
  photoKind: string | null
  photoBreed: string | null
  photoColour: string | null
  photoLook: string | null
  lostPin: LatLng | null
  memberAsked?: boolean
  optionalMode?: boolean
  mark?: unknown
}

export interface When {
  chip?: string
  date?: string
  part?: string | null
  exact?: string | null
  weak?: boolean
}

export interface StoryFound {
  species?: string
  name?: string
  time?: string
  city?: string
  place?: string
  chip?: boolean
  traits?: boolean
}

export interface DemoFound {
  sp: string
  colour: string
  size: string
  km: number
  bearing: number
  daysAgo: number
  where: string
  desc: string
}
export interface DemoLost {
  sp: string
  desc: string
  km: number
  bearing: number
  daysAgo: number
}
export interface RuleLost {
  sp: string
  colour: string | null
  size: string | null
  lostDay: Date
}
export type Clue = [string, number]
export interface Verdict {
  verdict: "match" | "maybe" | "no"
  clues: Clue[]
  score: number
}
export interface SearchResult extends Verdict {
  f: DemoFound
  lost: RuleLost
  desc: string
}

export const TIME_CHIPS: string[]
export const DAY_PARTS: [string, string, number][]
export function fmtDay(d: Date): string
export function fmtHM(d: Date): string
export function timeFromChip(chip: string): string
export function chipFromText(t: string): string | null
export function isoDay(d: Date | number | string): string
export function dayLabel(f: Pick<Field, "date" | "part" | "exact">): string
export function partOfHour(h: number): string
export function parseWhen(text: string): When | null

export const PLACES: string[]
export const CITIES: string[]
export function findCity(text: string): string | null
export function colourName(r: number, g: number, b: number): string
export const KINDS: [string, [number, number][], boolean?][]

export const autocorrect: ((text: string) => string) & { fixes?: [string, string][] }
export function osaDistance(a: string, b: string): number
export function knownWord(w: string): boolean
export function detectIntent(v: string): "lost" | "found" | "adoption" | "services" | "shop" | null
export function firstMatch(list: [string, RegExp][], v: string): string | null
export const SVC_TOPICS: [string, RegExp][]
export const SHOP_CATS: [string, RegExp][]
export const OTHER_SPECIES: [string, RegExp][]
export function cap(s: string): string
export function normPlace(p: string): string
export function sentences(raw: string): string[]

export const RULE: Record<string, number>
export const LOOKALIKE: [string, string][]
export const FOUND_REPORTS: DemoFound[]
export const LOST_REPORTS: DemoLost[]
export function atBearing(c: LatLng, km: number, deg: number): LatLng
export function ruleClues(lost: RuleLost, f: DemoFound): Clue[]
export function ruleVerdict(lost: RuleLost, f: DemoFound): Verdict
export const TIPS: { common: string[] } & Record<string, string | string[]>
export const CITY_LL: Record<string, LatLng>

export function bindReport(S: ReportState): {
  applyWhen(w: When): void
  parseStory(raw: string, opts?: { merge?: boolean; asked?: FieldKey | null }): StoryFound
  lostForRule(): RuleLost
  searchFound(): SearchResult | null
}
