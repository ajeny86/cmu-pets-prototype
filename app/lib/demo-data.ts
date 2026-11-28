/* Demo data only — no real people, phone numbers, emails or addresses.
   Section content comes from the prototype (index.html: SVC, ADOPT, SHOP). */

import type { LatLng } from "@/lib/ai/engine"

export const DEFAULT_CENTER: LatLng = [38.7223, -9.1393] // Lisbon, the demo city

/* ---------- Services & Care ---------- */
export type Service = { id: string; topic: string; title: string; meta: string; price?: string; rating: number; about: string }

const SVC: Record<string, { tip: string; items: [string, string][] }> = {
  Vaccinations: {
    tip: "Puppies and kittens get a series of core vaccines in their first months, then regular boosters — the vet sets the exact schedule.",
    items: [["Vet clinic · vaccinations", "0.8 km · open today · from €35"], ["Mobile vet · home visit", "Comes to you · next slot tomorrow"], ["24h veterinary hospital", "2.1 km · open now"]],
  },
  "Vet visit": {
    tip: "If it’s urgent — trouble breathing, bleeding, poisoning — go to a 24h vet right away.",
    items: [["24h veterinary hospital", "2.1 km · open now"], ["Vet clinic", "0.8 km · next slot today 16:30"], ["Online vet consultation", "Video call · within 15 min"]],
  },
  Grooming: {
    tip: "Book a groomer who works with your pet’s coat type and size.",
    items: [["Grooming salon", "1.2 km · from €30"], ["Mobile groomer", "Comes to you · from €45"], ["Self-service wash", "1.9 km · €12 per session"]],
  },
  "Dog walking": {
    tip: "Walkers on buddy are reviewed by other owners in your area.",
    items: [["Daily walks · 30 min", "4.9 ★ · 2 walkers nearby"], ["Group walks in the park", "Mon–Fri · from €10"], ["Puppy visits", "Short visits + play · from €12"]],
  },
  "Pet sitting": {
    tip: "Tell sitters about feeding, meds and routines — it keeps your pet calm.",
    items: [["Home sitter · overnight", "Stays at your place · from €35/night"], ["Pet hotel", "3.4 km · from €25/night"], ["Drop-in visits", "Feeding + play · from €12"]],
  },
  Training: {
    tip: "Short daily sessions work better than long ones.",
    items: [["Obedience class", "Group · 6 weeks · from €90"], ["Behaviour consult", "1:1 · at home"], ["Puppy school", "Socialisation · weekends"]],
  },
  Insurance: {
    tip: "Compare what’s covered: accidents, illness, routine care.",
    items: [["Accident & illness plan", "from €12/month"], ["Accident-only plan", "from €6/month"], ["Routine care add-on", "vaccines + check-ups"]],
  },
}

export const SERVICE_TOPICS = Object.keys(SVC)
export const serviceTip = (topic: string) => SVC[topic]?.tip ?? ""
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export const SERVICES: Service[] = Object.entries(SVC).flatMap(([topic, d], ti) =>
  d.items.map(([title, meta], i) => ({
    id: `${slug(topic)}-${i + 1}`,
    topic,
    title,
    meta,
    price: meta.match(/€[\d.]+(?:\/\w+)?/)?.[0],
    rating: Math.round((4.9 - ((ti + i) % 4) * 0.15) * 10) / 10,
    about: `${title}. ${d.tip} Demo listing — booking sends a request, no payment is taken.`,
  }))
)

/* ---------- Adoption ---------- */
export type AdoptPet = { id: string; sp: "dog" | "cat"; young: boolean; name: string; title: string; meta: string; about: string; emoji: string }

export const ADOPTION: AdoptPet[] = [
  { id: "bolt", sp: "dog", young: false, name: "Bolt", title: "Medium dog · 2 yrs", meta: "Friendly, good with kids · shelter 3 km", emoji: "🐕", about: "Bolt loves long walks and settles quickly at home. House-trained, vaccinated and chipped." },
  { id: "nina", sp: "cat", young: false, name: "Nina", title: "Adult cat · 4 yrs", meta: "Calm, indoor · foster home 1.5 km", emoji: "🐈", about: "Nina is a quiet indoor cat who likes a sunny window and a predictable routine." },
  { id: "pepper", sp: "dog", young: true, name: "Pepper", title: "Puppy · 3 months", meta: "Playful, vaccinated · shelter 5 km", emoji: "🐶", about: "Pepper is curious and full of energy — best with someone home most of the day." },
  { id: "miso", sp: "cat", young: true, name: "Miso", title: "Kitten · 10 weeks", meta: "Curious, litter-trained · foster 2 km", emoji: "🐱", about: "Miso is litter-trained and loves feather toys. Can go home with a sibling." },
  { id: "rufus", sp: "dog", young: false, name: "Rufus", title: "Senior dog · 9 yrs", meta: "Gentle, loves naps · shelter 3 km", emoji: "🐕", about: "Rufus is gentle and calm, happy with short walks and a soft bed." },
  { id: "lola", sp: "cat", young: false, name: "Lola", title: "Young cat · 1 yr", meta: "Social, likes other cats · shelter 4 km", emoji: "🐈", about: "Lola is social and gets on with other cats. Spayed, vaccinated and chipped." },
]
export const ADOPT_FILTERS = ["All", "Dogs", "Cats", "Puppies", "Kittens"] as const
export type AdoptFilter = (typeof ADOPT_FILTERS)[number]
export const adoptMatches = (a: AdoptPet, f: AdoptFilter) =>
  f === "All" || (f === "Dogs" && a.sp === "dog") || (f === "Cats" && a.sp === "cat") || (f === "Puppies" && a.sp === "dog" && a.young) || (f === "Kittens" && a.sp === "cat" && a.young)

/* ---------- Shop ---------- */
export type Product = { id: string; cat: string; title: string; size: string; price: string; emoji: string }

const SHOP: Record<string, [string, string, string][]> = {
  Food: [["Dry food · adult", "2 kg", "€14.90"], ["Wet food pack", "12 × 85 g", "€9.50"], ["Food for puppies / kittens", "1.5 kg", "€13.20"]],
  Treats: [["Training treats", "200 g", "€4.90"], ["Dental chews", "7 pcs", "€6.40"]],
  Toys: [["Rope toy", "Durable", "€7.90"], ["Ball set", "3 pcs", "€5.50"], ["Feather wand", "For cats", "€4.20"]],
  "Leashes & collars": [["Adjustable collar", "S–L", "€9.90"], ["Leash 1.5 m", "Reflective", "€12.50"], ["Harness", "No-pull", "€19.90"]],
  Litter: [["Clumping litter", "10 L", "€8.90"], ["Litter box", "With lid", "€24.00"]],
  Beds: [["Soft bed", "M · washable", "€29.90"], ["Cave bed", "For cats", "€22.50"]],
  Bowls: [["Steel bowl set", "2 × 0.5 L", "€11.90"], ["Slow feeder", "Anti-gulp", "€9.40"]],
  Carriers: [["Travel carrier", "Up to 8 kg", "€34.90"], ["Foldable crate", "M", "€49.00"]],
  "Care products": [["Gentle shampoo", "250 ml", "€8.20"], ["Flea & tick drops", "3 doses", "€18.90"], ["Brush", "Two-sided", "€7.50"]],
}
const SHOP_EMOJI: Record<string, string> = { Food: "🥣", Treats: "🦴", Toys: "🧶", "Leashes & collars": "🦮", Litter: "🪣", Beds: "🛏️", Bowls: "🥣", Carriers: "🧳", "Care products": "🧴" }
export const SHOP_CATEGORIES = Object.keys(SHOP)
export const PRODUCTS: Product[] = Object.entries(SHOP).flatMap(([cat, items]) =>
  items.map(([title, size, price], i) => ({ id: `${slug(cat)}-${i + 1}`, cat, title, size, price, emoji: SHOP_EMOJI[cat] }))
)

/* ---------- Vets & shelters (made up) — placed around wherever the report is, so the demo works in any city ---------- */
export type Place = { id: string; kind: "vet" | "shelter"; name: string; ll: LatLng; hours: string }
const PLACES_AROUND: { id: string; kind: Place["kind"]; name: string; km: number; bearing: number; hours: string }[] = [
  { id: "v1", kind: "vet", name: "Neighbourhood vet clinic (demo)", km: 0.6, bearing: 30, hours: "Open today · 9:00–20:00" },
  { id: "v2", kind: "vet", name: "24h veterinary hospital (demo)", km: 1.4, bearing: 210, hours: "Open 24 hours" },
  { id: "v3", kind: "vet", name: "Family vet practice (demo)", km: 2.2, bearing: 290, hours: "Open today · 10:00–19:00" },
  { id: "s1", kind: "shelter", name: "Animal shelter · city (demo)", km: 1.9, bearing: 120, hours: "Visits 11:00–17:00" },
  { id: "s2", kind: "shelter", name: "Rescue foster network (demo)", km: 3.1, bearing: 340, hours: "Call ahead" },
]
const around = (c: LatLng, km: number, deg: number): LatLng => {
  const r = (deg * Math.PI) / 180
  return [c[0] + (km / 111) * Math.cos(r), c[1] + (km / (111 * Math.cos((c[0] * Math.PI) / 180))) * Math.sin(r)]
}

export const kmBetween = (a: LatLng, b: LatLng) => {
  const R = 6371
  const r = Math.PI / 180
  const dLat = (b[0] - a[0]) * r
  const dLng = (b[1] - a[1]) * r
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
export const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1)} km`)

export function nearestPlaces(from: LatLng, n = 5) {
  return PLACES_AROUND.map(({ km, bearing, ...p }) => ({ ...p, ll: around(from, km, bearing), km }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
}
