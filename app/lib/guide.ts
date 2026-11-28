"use client"

/* Clue's routing: a free-text message → the right part of the app (prototype `#askGuide`). */

import { applyProfile, freshDraft, parseInto, understand, type Intent } from "@/lib/ai/story"
import { getState, signUp, update } from "@/lib/store"
import { toast } from "@/lib/toast"

/** The lost-pet form. A message about a lost pet always lands here, filled in from what was said. */
export const REPORT_PATH = "/lost-found/lost/report"

/** A question about a topic ("how do I find a lost cat?"), not someone telling us what happened. */
export function isQuestion(text: string) {
  const t = text.trim().toLowerCase()
  return (
    /\?\s*$/.test(t) ||
    /^(how|what|why|where|when|which|who|can|could|should|is|are|do|does|will|would|как|что|почему|зачем|где|когда|какой|какая|какие|можно|нужно|стоит|сколько|come|o que|como|porque|onde|quando|posso|devo)\b/.test(t)
  )
}

/** Demo sign-in (no password): the member's saved pet fills in only what the report is still missing. */
export function signInDemo() {
  if (!getState().profile) signUp({ name: "Demo member", email: "member@example.com", phone: "+351 900 000 000", city: "Lisbon" })
  update((s) => {
    if (s.pets[0]) s.draft = applyProfile(s.draft, s.pets[0], s.profile?.phone || s.profile?.email || "").draft
    s.draft.memberAsked = true
  })
}

/** Signs out; the contact and home the profile put into the open report go too. */
export function signOutDemo() {
  update((s) => {
    const p = s.profile
    s.profile = null
    s.draft.memberAsked = true
    for (const f of s.draft.fields) {
      const fromProfile = (f.k === "contact" && !!p && (f.v === p.phone || f.v === p.email)) || (f.k === "home" && f.v.startsWith("Saved in your profile"))
      if (fromProfile) Object.assign(f, { v: "", s: "optional" })
    }
  })
}

/** "Yes" / "no" typed as an answer, in the app's languages. */
// (\b doesn't see Cyrillic letters as word characters, so the word end is spelled out)
const END = String.raw`(?=$|[\s.,!?;:)])`
const YES = new RegExp(String.raw`^\s*(yes|yeah|yep|sure|i am|да|ага|конечно|зарегистрирован[аы]?|sim)${END}`, "i")
const NO = new RegExp(String.raw`^\s*(no|nope|not yet|i'?m not|нет|не зарегистрирован[аы]?|não|nao)${END}`, "i")
export const saysYes = (t: string) => YES.test(t)
export const saysNo = (t: string) => NO.test(t)

export const INTENT_PATH: Record<NonNullable<Intent>, string> = {
  lost: "/lost-found/lost/report",
  found: "/lost-found/found",
  adoption: "/adoption",
  services: "/services",
  shop: "/shop",
}

/** Starts a lost report from a message (and the member's saved pet, if signed in). */
export function startLostReport(message: string) {
  update((s) => {
    let d = parseInto(freshDraft(), message).draft
    if (s.profile && s.pets[0]) d = applyProfile(d, s.pets[0], s.profile.phone || s.profile.email).draft
    s.draft = d
    s.pending = null
  })
}

/** Reads a message and returns where to go. Unclear messages go to "Where to?". */
export function routeMessage(typed: string): string {
  const { text, fixes, intent } = understand(typed)
  if (fixes.length) toast("Understood: " + fixes.map(([a, b]) => `“${a}” → “${b}”`).join(", "))
  if (intent === "lost") {
    // straight to the form, filled in from the message; the form offers sign-in to members
    startLostReport(text)
    return REPORT_PATH
  }
  if (intent === "found") {
    update((s) => {
      s.pending = null
    })
    return INTENT_PATH.found
  }
  if (intent) {
    update((s) => {
      s.query = text
      s.pending = null
    })
    return INTENT_PATH[intent]
  }
  update((s) => {
    s.pending = text
  })
  return "/where-to"
}

const FIND_LOST = /(how (to|do i|can i|should i) (find|look for|search for)|where (to|should i|do i) (look|search)|как (найти|искать|отыскать|разыскать)|где (искать|найти)|что делать.{0,30}(потерял|пропал|сбежал)|como (encontrar|procurar))/
const URGENT =/urgent|bleed|poison|breath|emergenc|seizure|hit by a car|срочно|кров|отрав|не дыш|задыха|судорог|сбила машин|urgente|sangr|envenen/

/** Clue's chat reply, built on the same intent detection. */
export function chatReply(typed: string) {
  const { text, intent: detected } = understand(typed)
  const v = text.toLowerCase()
  // "how do I find my lost cat?" is about a lost pet, not a found one
  const intent: Intent = isQuestion(v) && FIND_LOST.test(v) ? "lost" : detected
  if (intent === "lost")
    return { text: "Sorry to hear that. I’ll start a lost report from what you told me — check it and I’ll search nearby.", links: [{ href: REPORT_PATH, label: "Open the report" }], intent, text2: text }
  if (URGENT.test(v))
    return { text: "If it’s urgent, go to a 24h vet right away. Here are the nearest ones.", links: [{ href: "/services", label: "Services & Care" }], intent: "services" as const }
  if (intent === "found")
    return { text: "Thank you for helping! Take a photo and I’ll create the found report.", links: [{ href: "/lost-found/found", label: "I found a pet" }], intent }
  if (intent === "adoption")
    return { text: "Lovely! Here are pets looking for a home near you.", links: [{ href: "/adoption", label: "See adoption" }], intent }
  if (intent === "services")
    return {
      text: URGENT.test(v)
        ?"If it’s urgent, go to a 24h vet right away. Here are the nearest ones."
        : "Good question for a vet or a carer. I’ve picked options near you.",
      links: [{ href: "/services", label: "Services & Care" }],
      intent,
    }
  if (intent === "shop") return { text: "I can help with that — here’s what’s in the shop.", links: [{ href: "/shop", label: "Open the shop" }], intent }
  if (/^(hi|hello|hey|привет|olá|ola)\b/.test(v)) return { text: "Hi! Tell me what happened, or what you’re looking for.", intent }
  if (/thank|спасибо|obrigad/.test(v)) return { text: "You’re welcome! I’m here if you need anything else.", intent }
  return {
    text: "I’m not sure I understood. I can help with lost & found pets, adoption, care and the shop — which one?",
    links: [
      { href: "/lost-found", label: "Lost & Found" },
      { href: "/adoption", label: "Adoption" },
      { href: "/services", label: "Services" },
      { href: "/shop", label: "Shop" },
    ],
    intent,
  }
}
