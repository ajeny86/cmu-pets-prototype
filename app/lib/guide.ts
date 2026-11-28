"use client"

/* Clue's routing: a free-text message → the right part of the app (prototype `#askGuide`). */

import { applyProfile, freshDraft, parseInto, understand, type Intent } from "@/lib/ai/story"
import { getState, update } from "@/lib/store"
import { toast } from "@/lib/toast"

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
    startLostReport(text)
    return getState().profile ? INTENT_PATH.lost : "/lost-found/lost"
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

/** Clue's chat reply, built on the same intent detection. */
export function chatReply(typed: string) {
  const { text, intent } = understand(typed)
  const v = text.toLowerCase()
  if (intent === "lost")
    return { text: "Sorry to hear that. I’ll start a lost report from what you told me — check it and I’ll search nearby.", links: [{ href: "/lost-found/lost", label: "Open the report" }], intent, text2: text }
  if (intent === "found")
    return { text: "Thank you for helping! Take a photo and I’ll create the found report.", links: [{ href: "/lost-found/found", label: "I found a pet" }], intent }
  if (intent === "adoption")
    return { text: "Lovely! Here are pets looking for a home near you.", links: [{ href: "/adoption", label: "See adoption" }], intent }
  if (intent === "services")
    return {
      text: /urgent|bleed|poison|breath|emergenc|срочно/.test(v)
        ? "If it’s urgent, go to a 24h vet right away. Here are the nearest ones."
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
