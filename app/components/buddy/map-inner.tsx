"use client"

import "leaflet/dist/leaflet.css"

import L from "leaflet"
import { useEffect } from "react"
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet"

import type { MapProps, PinKind } from "@/components/buddy/map"

const COLOURS: Record<PinKind, string> = {
  lost: "#f37cff",
  found: "#10288b",
  seen: "#b02fc0",
  last: "#b02fc0",
  vet: "#05a544",
  shelter: "#175a54",
  me: "#10288b",
}

const icon = (kind: PinKind) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:${kind === "last" ? 22 : 18}px;height:${kind === "last" ? 22 : 18}px;border-radius:50%;background:${COLOURS[kind]};border:3px solid #fff;box-shadow:0 2px 6px rgb(16 40 139/.35)"></span>`,
    iconSize: kind === "last" ? [22, 22] : [18, 18],
    iconAnchor: kind === "last" ? [11, 11] : [9, 9],
  })

function Clicks({ onPick }: { onPick?: MapProps["onPick"] }) {
  useMapEvents({ click: (e) => onPick?.([e.latlng.lat, e.latlng.lng]) })
  return null
}

function Recenter({ center, zoom, fit }: Pick<MapProps, "center" | "zoom" | "fit">) {
  const map = useMap()
  // re-centre only when the values change, not on every render (keeps the user's pan)
  const key = JSON.stringify([center, zoom, fit])
  useEffect(() => {
    const [c, z, f] = JSON.parse(key) as [MapProps["center"], number | undefined, MapProps["fit"]]
    if (f && f.length > 1) map.fitBounds(L.latLngBounds(f), { padding: [28, 28], maxZoom: 16 })
    else map.setView(c, z ?? map.getZoom())
  }, [map, key])
  return null
}

export default function MapInner({ center, zoom = 14, pins = [], circle, path, onPick, fit }: MapProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="size-full" attributionControl>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="© OpenStreetMap" />
      <Recenter center={center} zoom={zoom} fit={fit} />
      <Clicks onPick={onPick} />
      {circle && (
        <Circle center={circle.center} radius={circle.radius} pathOptions={{ color: "#b02fc0", weight: 1.5, fillColor: "#f37cff", fillOpacity: 0.14 }} />
      )}
      {path && path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#b02fc0", weight: 3, dashArray: "6 6" }} />}
      {pins.map((p, i) => (
        <Marker key={`${p.kind}-${i}-${p.ll[0]}`} position={p.ll} icon={icon(p.kind)}>
          {p.label && (
            <Tooltip direction="top" offset={[0, -10]} permanent={p.permanent}>
              {p.label}
            </Tooltip>
          )}
        </Marker>
      ))}
    </MapContainer>
  )
}
