/* Typed helpers around the ported prototype logic (./engine.js) for the lost-pet report. */

import {
  autocorrect,
  bindReport,
  cap,
  dayLabel,
  detectIntent,
  isoDay,
  timeFromChip,
  type Field,
  type FieldKey,
  type ReportState,
  type StoryFound,
} from "@/lib/ai/engine"

export type { Field, FieldKey, ReportState, StoryFound }
export type Intent = ReturnType<typeof detectIntent>

export function freshFields(): Field[] {
  // required: animal, name (the owner knows it), when · everything else optional
  return [
    { k: "species", label: "Animal", v: "", s: "missing", req: true },
    { k: "name", label: "Name", v: "", s: "missing", req: true },
    { k: "traits", label: "Special features", v: "", s: "optional" },
    { k: "city", label: "Where", v: "", s: "optional" },
    { k: "lost", label: "Exact place", v: "", s: "optional" },
    { k: "time", label: "When", v: "", s: "missing", req: true },
    { k: "chip", label: "Microchip / collar", v: "", s: "optional" },
    { k: "home", label: "Home location", v: "", s: "optional" },
    { k: "contact", label: "Your contact", v: "", s: "optional" },
  ]
}

export type LostDraft = ReportState & { fromProfile?: boolean }

export function freshDraft(): LostDraft {
  return {
    fields: freshFields(),
    transcript: "",
    pet: "",
    species: null,
    saidPlace: null,
    place: null,
    skipped: [],
    lostPhoto: null,
    photoNote: null,
    photoKind: null,
    photoBreed: null,
    photoColour: null,
    photoLook: null,
    lostPin: null,
  }
}

export const field = (d: { fields: Field[] }, k: FieldKey) => d.fields.find((f) => f.k === k)!

/** Corrects typos and wrong keyboard layout; returns the text and what was changed. */
export function understand(text: string) {
  const fixed = autocorrect(text)
  return { text: fixed, fixes: autocorrect.fixes ?? [], intent: detectIntent(fixed.toLowerCase()) }
}

/** Reads a story into a copy of the draft. `merge` adds to what's there (a reply to Clue's question). */
export function parseInto(draft: LostDraft, raw: string, opts?: { merge?: boolean; asked?: FieldKey | null }) {
  const d = structuredClone(draft)
  const found = bindReport(d).parseStory(raw, opts)
  return { draft: d, found }
}

export function searchMatch(draft: LostDraft) {
  return bindReport(structuredClone(draft)).searchFound()
}

export const petLabel = (d: LostDraft) => d.pet || (d.species ? "your " + d.species : "your pet")

export const isMissingReq = (d: LostDraft, f: Field) =>
  !!f.req && !f.v && !(f.k === "traits" && d.lostPhoto) && !(f.k === "city" && field(d, "lost").v)

export function counts(d: LostDraft) {
  const ok = d.fields.filter((f) => f.s === "ok" || f.s === "check").length
  const missing = d.fields.filter((f) => isMissingReq(d, f)).length
  return { ok, total: d.fields.length, missing }
}

const REQ_ORDER: FieldKey[] = ["species", "name", "time"]
const OPT_ORDER: FieldKey[] = ["city", "lost", "traits", "chip"]

/** What Clue asks next: photo → required fields → (on request) optional ones. */
export function nextAsk(d: LostDraft): FieldKey | "photo" | null {
  if (!d.lostPhoto && !d.skipped.includes("photo")) return "photo"
  const r = REQ_ORDER.find((k) => isMissingReq(d, field(d, k)))
  if (r) return r
  if (d.optionalMode) return OPT_ORDER.find((k) => !field(d, k).v && !d.skipped.includes(k)) ?? null
  return null
}

export function question(d: LostDraft, k: FieldKey | "photo") {
  const n = petLabel(d)
  const q: Partial<Record<FieldKey | "photo", string>> = {
    photo: `Add a photo of ${n} — I’ll fill in what I can see.`,
    species: "What kind of animal is it? Dog, cat, bird, rabbit, lizard…",
    name: `What’s ${d.species ? "your " + d.species + "’s" : "your pet’s"} name?`,
    traits: `Anything special about ${n} that a photo can’t show? Marks, collar — or character: shy, friendly…`,
    city: `Which city or area did you lose ${n} in?`,
    time: `When did you last see ${n}? Tap a time, or say it.`,
    lost: "Where exactly? Say a street or park — or mark it on the map.",
    chip: `Does ${n} have a microchip or a collar?`,
  }
  return q[k] ?? ""
}

/** Sets one field from a typed or picked value. */
export function setField(d: LostDraft, k: FieldKey, v: string, s: Field["s"] = "ok"): LostDraft {
  const next = structuredClone(d)
  const f = field(next, k)
  f.v = v
  f.fromPhoto = false
  f.s = v ? s : f.req ? "missing" : "optional"
  if (k === "name") next.pet = v
  if (k === "species") next.species = v ? v.toLowerCase() : null
  if (k === "lost") next.saidPlace = v || null
  return next
}

/** Time chips → a concrete day and time ("Just now" → "Sat 28 Nov, 10:15"). */
export function setTimeChip(d: LostDraft, chip: string): LostDraft {
  const next = structuredClone(d)
  const f = field(next, "time")
  const y = new Date()
  y.setDate(y.getDate() - 1)
  Object.assign(f, {
    chip,
    part: null,
    exact: null,
    date: chip === "Yesterday" ? isoDay(y) : isoDay(new Date()),
    s: "ok",
    v: chip === "Today" ? dayLabel({ date: isoDay(new Date()), part: null, exact: null }) : timeFromChip(chip),
  })
  return next
}

export function setTimeDate(d: LostDraft, date: string, part: string | null = null): LostDraft {
  const next = structuredClone(d)
  const f = field(next, "time")
  Object.assign(f, { chip: null, date, part, exact: null, s: "ok" })
  f.v = dayLabel(f)
  return next
}

/** A demo member's saved pet (the prototype's PROFILE). Demo data only. */
export const DEMO_PROFILE_PET = {
  species: "Dog",
  name: "Max",
  photo: "/assets/max.webp",
  breed: "Dachshund (smooth-haired)",
  colour: "Reddish brown",
  traits: "Pedigree tattoo on the inside of the hind thigh · friendly, comes when you call “Max!”, afraid of scooters",
  city: "Lisbon",
  chip: "Microchip 900 000 000 000 001",
  home: "Saved in your profile · private",
}

export type ProfilePet = typeof DEMO_PROFILE_PET

/** Fills only what the message didn't say; a message about another pet doesn't get the profile pet mixed in. */
export function applyProfile(d: LostDraft, pet: ProfilePet, contact: string): { draft: LostDraft; otherPet: boolean } {
  const next = structuredClone(d)
  const F = (k: FieldKey) => field(next, k)
  const nameSaid = F("name").v
  const spSaid = F("species").v
  const otherPet =
    (!!nameSaid && nameSaid.toLowerCase() !== pet.name.toLowerCase()) ||
    (!!spSaid && spSaid.toLowerCase() !== pet.species.toLowerCase())
  const fill = (k: FieldKey, v: string) => {
    if (!F(k).v && v) Object.assign(F(k), { v, s: "ok" })
  }
  fill("home", pet.home)
  fill("city", pet.city)
  fill("contact", contact)
  if (!otherPet) {
    fill("species", pet.species)
    fill("name", pet.name)
    fill("traits", pet.traits)
    fill("chip", pet.chip)
    next.pet = F("name").v
    next.species = F("species").v.toLowerCase()
    if (!next.lostPhoto) {
      next.lostPhoto = pet.photo
      next.photoNote = `From your profile — ${pet.name}’s photo.`
      next.photoKind = pet.species
      next.photoBreed = pet.breed
      next.photoColour = pet.colour
      next.photoLook = [pet.breed, pet.colour].join(", ")
    }
    if (!next.skipped.includes("photo")) next.skipped.push("photo")
    next.fromProfile = true
  }
  return { draft: next, otherPet }
}

export { cap }
