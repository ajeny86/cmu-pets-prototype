"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { CITIES, CITY_LL, cap, parseWhen, PLACES, TIME_CHIPS, DAY_PARTS, isoDay, type LatLng } from "@/lib/ai/engine"
import {
  counts,
  field,
  freshDraft,
  isMissingReq,
  nextAsk,
  parseInto,
  petLabel,
  question,
  setField,
  setTimeChip,
  setTimeDate,
  type Field,
  type FieldKey,
  type LostDraft,
} from "@/lib/ai/story"
import { readPhoto, shrinkPhoto } from "@/lib/ai/photo"
import { signInDemo } from "@/lib/guide"
import { update, useBuddy } from "@/lib/store"
import { toast } from "@/lib/toast"
import { DEFAULT_CENTER } from "@/lib/demo-data"
import { Clue } from "@/components/buddy/clue"
import { AskBar, PetPhoto, PhotoPicker, speciesEmoji } from "@/components/buddy/kit"
import { BuddyMap, placeLL, placeName } from "@/components/buddy/map"
import { Button } from "@/components/ui/button"

export const setDraft = (fn: (d: LostDraft) => LostDraft) =>
  update((s) => {
    s.draft = fn(s.draft)
  })

/* ---------- photo → what the AI can read from it (prototype analysePhoto) ---------- */
export async function addLostPhoto(file: File) {
  const url = await shrinkPhoto(file)
  setDraft((d) => ({ ...d, lostPhoto: url, photoKind: null, photoLook: null, photoBreed: null, photoColour: null, photoNote: "AI is looking at the photo…", fromProfile: false }))
  const r = await readPhoto(url)
  setDraft((cur) => {
    if (cur.lostPhoto !== url) return cur // photo changed meanwhile
    const d = structuredClone(cur)
    const sp = field(d, "species")
    const notes: string[] = []
    let filledSpecies = false
    if (r.kind) {
      if (sp.v.toLowerCase() === r.kind.toLowerCase()) sp.s = "ok"
      else if (!sp.v || sp.fromPhoto) {
        Object.assign(sp, { v: r.kind, s: "check", fromPhoto: true })
        d.species = r.kind.toLowerCase()
        filledSpecies = true
      } else notes.push(`the photo looks like a ${r.kind.toLowerCase()}, but the card says ${sp.v.toLowerCase()}`)
    }
    d.photoBreed = r.kind ? r.breed ?? null : null
    d.photoColour = r.colour
    d.photoLook = r.look
    d.photoKind = r.kind
    const tr = field(d, "traits")
    if (d.photoLook && !tr.v) Object.assign(tr, { v: cap(d.photoLook), s: "check", fromPhoto: true })
    if (r.breed) notes.push(`looks like a ${r.breed}`)
    if (r.failed) notes.push("photo recognition is offline right now")
    else if (!r.kind) notes.push("I couldn’t clearly see an animal — a closer photo helps matching")
    d.photoNote = (r.kind ? `✧ I see a ${r.kind.toLowerCase()} on the photo.` : "✧") + (notes.length ? ` ${cap(notes.join("; "))}.` : "") + (filledSpecies ? " Please check." : "")
    if (!d.skipped.includes("photo")) d.skipped.push("photo")
    return d
  })
  toast(r.kind ? `AI: it’s a ${r.kind.toLowerCase()}${r.breed ? ` (looks like a ${r.breed})` : ""}` : "Photo added · AI will use it to match")
}

export function PhotoBlock({ d }: { d: LostDraft }) {
  return (
    <div className="flex items-center gap-3.5 rounded-card bg-frost p-3 shadow-soft md:bg-white">
      <PetPhoto src={d.lostPhoto} emoji={speciesEmoji(d.species)} size={84} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className={cn("text-[13px] leading-[18px]", d.photoNote ? "font-semibold text-pink-ink" : "text-muted-foreground")}>
          {d.photoNote ?? `A photo helps people recognise ${petLabel(d)} — I’ll read what I can see.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <PhotoPicker onFile={addLostPhoto} label={d.lostPhoto ? "Change photo" : "Add photo"} variant="outline" className="h-9 px-3.5 text-[13px]" />
          {!d.lostPhoto && !d.skipped.includes("photo") && (
            <Button variant="ghost" className="h-9 px-3 text-[13px]" onClick={() => setDraft((x) => ({ ...x, skipped: [...x.skipped, "photo"] }))}>
              No photo
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- the fields, editable in place ---------- */
const PLACEHOLDER: Partial<Record<FieldKey, string>> = {
  species: "Dog, cat, bird…",
  name: "Pet’s name",
  traits: "Marks, collar, character — e.g. white spot on chest, shy",
  city: "Start typing a city…",
  lost: "Street, park or landmark",
  chip: "Microchip no. or collar",
  home: "Optional · kept private",
  contact: "Phone or email · shown only to finders",
}

function Status({ f, d }: { f: Field; d: LostDraft }) {
  if (f.s === "check") return <span title="Filled by AI — check it" className="text-xs font-bold text-pink-ink">✧</span>
  if (f.s === "ok") return <span title="Confirmed" className="text-xs font-bold text-green">✓</span>
  if (isMissingReq(d, f)) return <span title="Needed" className="text-xs font-bold text-magenta">•</span>
  return <span />
}

function Row({ f, d, children }: { f: Field; d: LostDraft; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)_14px] items-start gap-2 border-b border-line/70 py-2.5 last:border-0 md:grid-cols-[140px_minmax(0,1fr)_16px]">
      <span className="pt-2.5 text-[12.5px] font-bold text-navy-muted">
        {f.label}
        {f.req && <i className="text-magenta not-italic">*</i>}
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
      <span className="pt-2.5">
        <Status f={f} d={d} />
      </span>
    </div>
  )
}

function TextField({ f, list, area }: { f: Field; d?: LostDraft; list?: string; area?: boolean }) {
  const cls = cn(
    "w-full rounded-[14px] bg-white px-3 py-2 text-[14.5px] font-semibold text-navy shadow-[0_2px_8px_rgb(16_40_139/0.05)] outline-none placeholder:font-normal placeholder:text-periwinkle-2 focus:shadow-[inset_0_0_0_1.5px_var(--navy)]",
    f.s === "check" && "shadow-[inset_0_0_0_1.5px_var(--pink)]"
  )
  const onChange = (v: string) => setDraft((x) => setField(x, f.k, v))
  return area ? (
    <textarea rows={2} value={f.v} placeholder={PLACEHOLDER[f.k]} onChange={(e) => onChange(e.target.value)} className={cn(cls, "field-sizing-content min-h-[42px] resize-none")} />
  ) : (
    <input value={f.v} list={list} placeholder={PLACEHOLDER[f.k]} onChange={(e) => onChange(e.target.value)} className={cls} />
  )
}

function TimeField({ f, d }: { f: Field; d: LostDraft }) {
  const today = isoDay(new Date())
  const hour = new Date().getHours()
  const parts = f.date ? DAY_PARTS.filter((p) => f.date !== today || p[2] <= hour) : []
  const [custom, setCustom] = useState(false)
  return (
    <Row f={f} d={d}>
      <span className={cn("pt-2 text-[14.5px] font-semibold", f.v ? "text-navy" : "text-periwinkle-2")}>
        {f.v ? `${f.s === "check" ? "✧ " : ""}${f.v}` : `When did you last see ${petLabel(d)}?`}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {TIME_CHIPS.map((t) => (
          <Pill key={t} on={f.chip === t} onClick={() => setDraft((x) => setTimeChip(x, t))}>
            {t}
          </Pill>
        ))}
        <Pill on={custom || (!!f.date && !f.chip)} onClick={() => setCustom(!custom)}>
          📅 Pick a date
        </Pill>
      </div>
      {(custom || (f.date && !f.chip)) && (
        <input type="date" max={today} value={f.date ?? ""} onChange={(e) => e.target.value && setDraft((x) => setTimeDate(x, e.target.value))} className="w-fit rounded-[12px] bg-white px-3 py-1.5 text-sm text-navy shadow-soft" />
      )}
      {parts.length > 0 && !f.chip?.match(/Just now|hours/) && (
        <>
          <span className="text-[11.5px] text-muted-foreground">What part of the day?</span>
          <div className="flex flex-wrap gap-1.5">
            {parts.map((p) => (
              <Pill key={p[0]} on={f.part === p[0]} onClick={() => setDraft((x) => setTimeDate(x, f.date!, p[0]))}>
                {p[0]}
              </Pill>
            ))}
          </div>
        </>
      )}
    </Row>
  )
}

export function Pill({ on, onClick, children, className }: { on?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={!!on}
      onClick={onClick}
      className={cn("cursor-pointer rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-navy shadow-[0_2px_6px_rgb(16_40_139/0.07)] hover:bg-tint aria-pressed:bg-navy aria-pressed:text-white", className)}
    >
      {children}
    </button>
  )
}

/** Current location → pin + place name. */
export function useCurrentLocation(onPin: (ll: LatLng, name: string | null) => void) {
  return () => {
    if (!navigator.geolocation) return toast("Location isn’t available in this browser")
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const ll: LatLng = [p.coords.latitude, p.coords.longitude]
        onPin(ll, await placeName(ll))
      },
      () => toast("Couldn’t get your location — allow it, or mark the map"),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }
}

export async function centerFor(d: LostDraft): Promise<LatLng> {
  return d.lostPin ?? (await placeLL(field(d, "lost").v && field(d, "city").v ? `${field(d, "lost").v}, ${field(d, "city").v}` : null)) ?? (await placeLL(field(d, "city").v, CITY_LL)) ?? DEFAULT_CENTER
}

function PlaceField({ f, d }: { f: Field; d: LostDraft }) {
  const [map, setMap] = useState(false)
  const [center, setCenter] = useState<LatLng>(d.lostPin ?? DEFAULT_CENTER)
  const pin = (ll: LatLng, name: string | null) =>
    setDraft((x) => {
      const n = setField(x, "lost", name || field(x, "lost").v || `Pin ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`)
      n.lostPin = ll
      return n
    })
  const here = useCurrentLocation((ll, name) => {
    pin(ll, name)
    setCenter(ll)
    setMap(true)
  })
  return (
    <Row f={f} d={d}>
      <TextField f={f} d={d} list="buddy-places" />
      <div className="flex flex-wrap gap-1.5">
        <Pill onClick={here}>📍 Current location</Pill>
        <Pill
          on={map}
          onClick={async () => {
            if (!map) setCenter(await centerFor(d))
            setMap(!map)
          }}
        >
          🗺 Mark on map
        </Pill>
      </div>
      {map && (
        <BuddyMap
          className="h-[200px]"
          center={center}
          zoom={15}
          hint={`Tap where ${petLabel(d)} was last seen`}
          pins={d.lostPin ? [{ ll: d.lostPin, kind: "lost" }] : []}
          onPick={async (ll) => pin(ll, await placeName(ll))}
        />
      )}
    </Row>
  )
}

export function ReportFields({ d, keys }: { d: LostDraft; keys?: FieldKey[] }) {
  const show = keys ? d.fields.filter((f) => keys.includes(f.k)) : d.fields
  return (
    <div className="rounded-card bg-frost px-3.5 py-1 shadow-soft md:bg-white md:px-5">
      <datalist id="buddy-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="buddy-places">{PLACES.map((c) => <option key={c} value={c} />)}</datalist>
      {show.map((f) =>
        f.k === "time" ? (
          <TimeField key={f.k} f={f} d={d} />
        ) : f.k === "lost" ? (
          <PlaceField key={f.k} f={f} d={d} />
        ) : (
          <Row key={f.k} f={f} d={d}>
            <TextField f={f} d={d} list={f.k === "city" ? "buddy-cities" : undefined} area={f.k === "traits"} />
          </Row>
        )
      )}
    </div>
  )
}

export function Progress({ d }: { d: LostDraft }) {
  const { ok, total, missing } = counts(d)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground">
        {ok} of {total} details added{missing ? ` · ${missing} needed` : " · ready to search"}
      </p>
      <div className="flex gap-1">
        {d.fields.map((_, i) => (
          <i key={i} className={cn("h-1.5 flex-1 rounded-full", i < ok ? "bg-green" : "bg-tint-2")} />
        ))}
      </div>
    </div>
  )
}

/* ---------- Clue's dock: one question at a time, the answer is spread over the fields ---------- */
export function ClueDock({ d, onReady }: { d: LostDraft; onReady: () => void }) {
  const ask = nextAsk(d)
  const ready = counts(d).missing === 0
  const send = (text: string) =>
    setDraft((cur) => {
      const asked = ask && ask !== "photo" ? ask : null
      const { draft: next, found } = parseInto(cur, text, { merge: true, asked })
      // a direct answer to the question ("Luna", "Lisbon") when the parser found nothing for it
      if (asked && !(asked in found) && !(asked === "lost" && found.place)) {
        if (asked === "time") {
          const w = parseWhen(text)
          if (!w) Object.assign(field(next, "time"), { v: cap(text), s: "ok", chip: null })
        } else if (asked !== "traits" || !found.traits) {
          return setField(next, asked, asked === "species" || asked === "name" || asked === "city" ? cap(text.replace(/[.!]+$/, "")) : cap(text))
        }
      }
      return next
    })
  return (
    <div className="sticky bottom-[104px] z-10 flex flex-col gap-2 rounded-[24px] bg-white/95 px-3.5 pt-3 pb-3 shadow-[0_10px_30px_rgb(16_40_139/0.14)] backdrop-blur-sm md:top-24 md:bottom-auto md:gap-3 md:p-5">
      <div className="flex items-center gap-2">
        <Clue state={ready ? "success" : "thinking"} width={40} alt="" />
        <p className="flex-1 text-sm leading-[19px] font-semibold text-navy">
          {ready
            ? ask
              ? question(d, ask)
              : "✓ All set — search now, or add more details."
            : ask
              ? question(d, ask)
              : "Tell me the details by voice or text, and I’ll fill in the form."}
        </p>
        {ask && ask !== "photo" && (
          <button
            type="button"
            className="shrink-0 cursor-pointer text-xs text-muted-foreground underline"
            onClick={() => setDraft((x) => ({ ...x, skipped: [...x.skipped, ask] }))}
            hidden={!!field(d, ask).req}
          >
            Skip
          </button>
        )}
      </div>
      <AskBar placeholder="Tell me — voice or text" onSend={send} className="shadow-none ring-1 ring-line" />
      {ready && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onReady}>
            Continue →
          </Button>
          {!d.optionalMode && (
            <Button variant="outline" onClick={() => setDraft((x) => ({ ...x, optionalMode: true }))}>
              Add more
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** The lost report page itself (11 first open → 12 all set → 12b signed in). */
export function LostReportForm() {
  const s = useBuddy()
  const router = useRouter()
  const d = s.draft
  const empty = !d.transcript && d.fields.every((f) => !f.v) && !d.lostPhoto
  const member = !!s.profile
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:items-start md:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
        <span className="grid size-10 place-items-center rounded-full bg-tint text-lg">👤</span>
        <p className="flex-1 text-[13px] leading-[18px]">
          {member ? (
            <>
              Signed in as <b>{s.profile!.name}</b>
              {d.fromProfile && <> · {d.pet}’s details are from your profile</>}
            </>
          ) : (
            <>
              <b>Already registered?</b> Sign in and your pet’s details fill in from your profile. Or carry on as a guest — no account needed.
            </>
          )}
        </p>
        {!member && (
          <Button
            variant="ghost"
            className="h-8 shrink-0 px-3 text-xs"
            onClick={() => {
              signInDemo()
              toast("Signed in · what was missing is added from your profile")
            }}
          >
            Sign in
          </Button>
        )}
      </div>
      <div>
        <h2 className="text-section">{empty ? "Let’s find your pet" : `Let’s find ${petLabel(d)}`}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {empty ? "Add a photo, and I’ll recognise key details. You can then add the rest by voice or text." : "Check what I filled in (✧) and add what’s missing."}
        </p>
      </div>
      {d.transcript && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold">See what you told me</summary>
          <p className="mt-1 italic">“{d.transcript.trim()}”</p>
        </details>
      )}
      <PhotoBlock d={d} />
      <Progress d={d} />
      <ReportFields d={d} />
      {!empty && (
        <button type="button" className="cursor-pointer self-start text-xs font-semibold text-muted-foreground underline" onClick={() => confirm("Start a new, empty report?") && setDraft(() => freshDraft())}>
          Start a new report
        </button>
      )}
      </div>
      <ClueDock d={d} onReady={() => router.push("/lost-found/lost/location")} />
    </div>
  )
}
