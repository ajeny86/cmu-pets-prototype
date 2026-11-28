"use client"

/* Everything the app remembers, saved in this browser's localStorage (no server).
   Read with `useBuddy()`, change with `update(draft => { ... })`. */

import { useSyncExternalStore } from "react"

import type { LatLng } from "@/lib/ai/engine"
import { DEMO_PROFILE_PET, freshDraft, type LostDraft, type ProfilePet } from "@/lib/ai/story"

export type Profile = { name: string; email: string; phone: string; city: string }
export type MyPet = ProfilePet & { id: string }

export type LostReport = {
  id: string
  createdAt: number
  draft: LostDraft
  status: "searching" | "match" | "no-match" | "reunited"
  match: import("@/lib/match").MatchResult | null
  /** Owner said the suggested match wasn't their pet. */
  rejected?: boolean
}

export type FoundNow = "with" | "home" | "seen"
export type FoundDraft = {
  photo: string | null
  reading: { kind: string | null; breed?: string | null; colour: string | null; look: string; failed?: boolean; guess?: string } | null
  animal: string
  collar: string
  notes: string
  spot: string
  spotLL: LatLng | null
  time: string
  now: FoundNow | null
  /** "I only saw it": the way it went, last point = last seen. */
  route: LatLng[]
}
export type FoundReport = FoundDraft & { id: string; createdAt: number; code: string }

export type ChatMsg = { from: "me" | "ai"; text: string; links?: { href: string; label: string }[] }
export type Request = { id: string; kind: "booking" | "visit"; title: string; at: number }

export type Settings = { matchAlerts: boolean; sightingAlerts: boolean; newsletter: boolean }

export type BuddyState = {
  v: 1
  profile: Profile | null
  pets: MyPet[]
  /** Lost report being written. */
  draft: LostDraft
  /** An unclear message from Home, waiting for "where to?". */
  pending: string | null
  /** The message that sent someone to Adoption / Services / Shop. */
  query: string | null
  reports: LostReport[]
  currentReport: string | null
  found: FoundDraft
  foundReports: FoundReport[]
  currentFound: string | null
  chat: ChatMsg[]
  requests: Request[]
  cart: Record<string, number>
  favourites: string[]
  settings: Settings
}

export const freshFound = (): FoundDraft => ({
  photo: null,
  reading: null,
  animal: "",
  collar: "",
  notes: "",
  spot: "",
  spotLL: null,
  time: "",
  now: null,
  route: [],
})

export const CHAT_HELLO: ChatMsg = {
  from: "ai",
  text: "Hi! I can help with lost & found pets, adoption, care and the shop. What do you need?",
  links: [
    { href: "/lost-found/lost", label: "I lost a pet" },
    { href: "/lost-found/found", label: "I found a pet" },
  ],
}

export function initialState(): BuddyState {
  return {
    v: 1,
    profile: null,
    pets: [],
    draft: freshDraft(),
    pending: null,
    query: null,
    reports: [],
    currentReport: null,
    found: freshFound(),
    foundReports: [],
    currentFound: null,
    chat: [CHAT_HELLO],
    requests: [],
    cart: {},
    favourites: [],
    settings: { matchAlerts: true, sightingAlerts: true, newsletter: false },
  }
}

const KEY = "buddy:v1"
const SERVER = initialState()
let state: BuddyState | null = null
const listeners = new Set<() => void>()

function load(): BuddyState {
  if (state) return state
  try {
    const raw = localStorage.getItem(KEY)
    state = raw ? { ...initialState(), ...(JSON.parse(raw) as BuddyState) } : initialState()
  } catch {
    state = initialState()
  }
  return state
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
function save() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // storage full or blocked: drop the photos and try again, the app keeps working
      try {
        const lean = structuredClone(state!)
        lean.reports.forEach((r) => (r.draft.lostPhoto = r.draft.lostPhoto?.startsWith("data:") ? null : r.draft.lostPhoto))
        lean.foundReports.forEach((r) => (r.photo = null))
        localStorage.setItem(KEY, JSON.stringify(lean))
      } catch {}
    }
  }, 150)
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return
    state = null
    load()
    listeners.forEach((l) => l())
  })
}

export function getState() {
  return load()
}

/** Change the saved state. The callback gets a copy it may change in place. */
export function update(fn: (s: BuddyState) => void) {
  const next = structuredClone(load())
  fn(next)
  state = next
  save()
  listeners.forEach((l) => l())
}

export function resetAll() {
  state = initialState()
  try {
    localStorage.removeItem(KEY)
  } catch {}
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** The saved state. On the server and during hydration it's the empty starting state. */
export function useBuddy(): BuddyState {
  return useSyncExternalStore(subscribe, load, () => SERVER)
}

/** True once the browser's saved state has been read (after hydration). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)

export const isMember = (s: BuddyState) => !!s.profile

export function signUp(profile: Profile, withDemoPet = true) {
  update((s) => {
    s.profile = profile
    if (withDemoPet && !s.pets.length) s.pets.push({ ...DEMO_PROFILE_PET, city: profile.city || DEMO_PROFILE_PET.city, id: uid() })
  })
}

export const currentReport = (s: BuddyState) => s.reports.find((r) => r.id === s.currentReport) ?? null
export const currentFound = (s: BuddyState) => s.foundReports.find((r) => r.id === s.currentFound) ?? null
