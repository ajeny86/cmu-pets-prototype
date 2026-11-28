"use client"

import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"
import type { LatLng } from "@/lib/ai/engine"

export type PinKind = "lost" | "found" | "seen" | "last" | "vet" | "shelter" | "me"
export type Pin = { ll: LatLng; kind: PinKind; label?: string; permanent?: boolean }
export type MapProps = {
  center: LatLng
  zoom?: number
  pins?: Pin[]
  circle?: { center: LatLng; radius: number }
  path?: LatLng[]
  /** Tap on the map → coordinates (mark a point). */
  onPick?: (ll: LatLng) => void
  /** Zoom so these points all fit. */
  fit?: LatLng[]
}

const Inner = dynamic(() => import("@/components/buddy/map-inner"), {
  ssr: false,
  loading: () => <div className="grid size-full place-items-center text-xs text-muted-foreground">Loading the map…</div>,
})

/** OpenStreetMap map (Leaflet), loaded in the browser only. */
export function BuddyMap({ className, hint, ...props }: MapProps & { className?: string; hint?: string }) {
  return (
    <div className={cn("relative isolate h-[220px] overflow-hidden rounded-[18px] bg-[#e9ecf5] shadow-soft", className)}>
      <Inner {...props} />
      {hint && (
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
          {hint}
        </span>
      )}
    </div>
  )
}

export function MapKey({ items }: { items: [PinKind, string][] }) {
  const col: Record<PinKind, string> = { lost: "bg-pink", found: "bg-navy", seen: "bg-magenta", last: "bg-magenta", vet: "bg-green", shelter: "bg-teal", me: "bg-navy" }
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
      {items.map(([k, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <i className={cn("size-2.5 rounded-full ring-2 ring-white", col[k])} />
          {label}
        </span>
      ))}
    </div>
  )
}

/** Place name ↔ coordinates via OpenStreetMap Nominatim (as in the prototype). */
const geoCache: Record<string, Promise<LatLng | null>> = {}
const osm = (path: string) =>
  fetch(`https://nominatim.openstreetmap.org/${path}&format=json&accept-language=en`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

export async function placeLL(q: string | null | undefined, cityLL?: Record<string, LatLng>): Promise<LatLng | null> {
  const k = (q || "").trim().toLowerCase()
  if (!k) return null
  if (cityLL?.[k]) return cityLL[k]
  if (!(k in geoCache))
    geoCache[k] = osm(`search?limit=1&q=${encodeURIComponent(q!)}`).then((j) => (j && j[0] ? [+j[0].lat, +j[0].lon] : null))
  return geoCache[k]
}

export async function placeName(ll: LatLng): Promise<string | null> {
  const j = await osm(`reverse?zoom=17&lat=${ll[0]}&lon=${ll[1]}`)
  const a = j?.address
  if (!a) return null
  const main = a.road || a.pedestrian || a.footway || a.park || a.leisure || a.square || a.neighbourhood || j.name
  const area = a.suburb || a.quarter || a.neighbourhood || a.city_district || a.city || a.town
  return [main, area !== main && area].filter(Boolean).join(", ") || null
}
