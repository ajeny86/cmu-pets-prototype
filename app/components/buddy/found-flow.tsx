"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { bindReport, cap, fmtDay, fmtHM, LOST_REPORTS, ruleVerdict, type LatLng } from "@/lib/ai/engine"
import { readPhoto, shrinkPhoto } from "@/lib/ai/photo"
import { field, petLabel } from "@/lib/ai/story"
import { DEFAULT_CENTER, fmtKm, kmBetween, nearestPlaces } from "@/lib/demo-data"
import { localToDemo } from "@/lib/match"
import { currentFound, freshFound, uid, update, useBuddy, useHydrated, type FoundDraft, type FoundNow } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Clue } from "@/components/buddy/clue"
import { AiNote, LinkCard, PetPhoto, PhotoPicker, SectionTitle, speciesEmoji, StatusSteps } from "@/components/buddy/kit"
import { BuddyMap, MapKey, placeName, type Pin } from "@/components/buddy/map"
import { Pill } from "@/components/buddy/lost-report"
import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const setFound = (patch: Partial<FoundDraft> | ((f: FoundDraft) => Partial<FoundDraft>)) =>
  update((s) => {
    Object.assign(s.found, typeof patch === "function" ? patch(s.found) : patch)
  })

/* ---------- 20 · Submit picture ---------- */
export function FoundPhoto() {
  const router = useRouter()
  const start = async (src: string) => {
    update((s) => {
      s.found = { ...freshFound(), photo: src }
    })
    router.push("/lost-found/found/analysing")
  }
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/lost-found">Lost & Found</BackLink>
      <PageTitle title="Thanks for helping!">Take a photo of the animal. AI will create the report.</PageTitle>
      <AiNote title="✧  AI helper">
        Approach calmly and from the side. Don’t chase. If it has a collar, check for a tag — a vet can scan for a chip for free.
      </AiNote>
      <div className="flex flex-col items-center gap-4 rounded-card bg-frost p-6 text-center shadow-soft md:bg-white md:p-10">
        <span className="grid size-28 place-items-center rounded-[24px] bg-sage text-5xl">📷</span>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <PhotoPicker onFile={async (f) => start(await shrinkPhoto(f))} />
          <Button variant="outline" onClick={() => start("/assets/max.webp")}>
            Use example photo
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Location and time are added from your phone. You can edit them next. The photo is analysed on this device.</p>
    </div>
  )
}

/** Location from the phone, or the demo city when it's not available. */
function locate(): Promise<LatLng> {
  return new Promise((ok) => {
    if (!navigator.geolocation) return ok(DEFAULT_CENTER)
    navigator.geolocation.getCurrentPosition(
      (p) => ok([p.coords.latitude, p.coords.longitude]),
      () => ok(DEFAULT_CENTER),
      { timeout: 6000 }
    )
  })
}

/* ---------- 21 · AI analyses picture ---------- */
export function FoundAnalyse() {
  const s = useBuddy()
  const ready = useHydrated()
  const router = useRouter()
  const photo = s.found.photo
  const [result, setResult] = useState<string | null>(null)
  const [animDone, setAnimDone] = useState(false)
  const ran = useRef(false)
  useEffect(() => {
    if (!ready) return
    if (!photo) return void router.replace("/lost-found/found")
    if (ran.current) return
    ran.current = true
    ;(async () => {
      const [r, ll] = await Promise.all([readPhoto(photo), locate()])
      const now = new Date()
      const animal = r.kind ? [r.kind, r.breed ? `looks like a ${r.breed}` : null, r.colour].filter(Boolean).join(" · ") : ""
      const spot = (await placeName(ll)) || "Your current location"
      setFound({
        reading: { kind: r.kind, breed: r.breed, colour: r.colour, look: r.look, failed: r.failed, guess: r.guess },
        animal,
        spot,
        spotLL: ll,
        time: `${fmtDay(now)}, ${fmtHM(now)}`,
        collar: "Not visible on photo",
      })
      setResult(r.kind ? `Detected: ${r.kind.toLowerCase()}${r.colour ? ` · ${r.colour}` : ""}` : r.failed ? "Recognition offline — you can type it" : `Not sure what animal${r.guess ? ` (${r.guess}?)` : ""}`)
    })()
  }, [ready, photo, router])
  useEffect(() => {
    if (result && animDone) router.replace("/lost-found/found/check")
  }, [result, animDone, router])
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <Clue state="loading" width={140} alt="Clue is working" />
      <PageTitle title="Creating the report">AI analyses the picture.</PageTitle>
      <PetPhoto src={photo} size={120} />
      <StatusSteps
        className="w-full text-left"
        title={result ? "Report ready" : "Working on it"}
        steps={result ? ["Read your photo", result, "Added spot location and time", `Searched ${LOST_REPORTS.length + s.reports.length + 7} lost-pet reports nearby`] : ["Read your photo"]}
        speed={450}
        onDone={() => result && setAnimDone(true)}
      />
      {!result && <p className="animate-pulse text-sm font-semibold text-pink-ink">Looking for the animal…</p>}
      <p className="text-xs text-muted-foreground">The first time, the AI model downloads once (~15 s) — then it works offline on this device.</p>
    </div>
  )
}

/* ---------- 22 · Check the found report ---------- */
const NOW: { k: FoundNow; title: string; text: string }[] = [
  { k: "with", title: "I’m with it now", text: "We’ll tell you what to do while you wait." },
  { k: "home", title: "I took it home", text: "We’ll notify you when a matching lost report appears." },
  { k: "seen", title: "I only saw it", text: "Your sighting helps owners track the pet." },
]

function FRow({ label, children, ai }: { label: string; children: React.ReactNode; ai?: boolean }) {
  return (
    <label className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-2 border-b border-line/70 py-2.5 last:border-0 md:grid-cols-[150px_minmax(0,1fr)]">
      <span className="pt-2.5 text-[12.5px] font-bold text-navy-muted">{label}</span>
      <span className="flex flex-col gap-1">
        {children}
        {ai && <i className="text-[11px] font-semibold text-pink-hint not-italic">✧ from the photo — check it</i>}
      </span>
    </label>
  )
}

const inputCls = "w-full rounded-[14px] bg-white px-3 py-2 text-[14.5px] font-semibold text-navy shadow-[0_2px_8px_rgb(16_40_139/0.05)] outline-none placeholder:font-normal placeholder:text-periwinkle-2 focus:shadow-[inset_0_0_0_1.5px_var(--navy)]"

export function FoundCheck() {
  const s = useBuddy()
  const ready = useHydrated()
  const router = useRouter()
  const f = s.found
  const [map, setMap] = useState(false)
  useEffect(() => {
    if (ready && !f.photo) router.replace("/lost-found/found")
  }, [ready, f.photo, router])
  const create = () => {
    if (f.now === "seen") return router.push("/lost-found/found/sighting")
    const id = uid()
    update((st) => {
      st.foundReports.unshift({ ...structuredClone(st.found), id, createdAt: Date.now(), code: id.slice(0, 4) })
      st.currentFound = id
    })
    router.push("/lost-found/found/created")
  }
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-4">
        <BackLink href="/lost-found/found">Photo</BackLink>
        <PageTitle title="Check the found report">AI filled this in from your photo. Edit anything that’s wrong.</PageTitle>
        <div className="flex items-center gap-3">
          <PetPhoto src={f.photo} size={96} />
          <p className="text-[13px] leading-[18px] text-pink-ink">
            {f.reading?.kind ? `✧ I see a ${f.reading.kind.toLowerCase()} on the photo${f.reading.breed ? ` — looks like a ${f.reading.breed}` : ""}.` : "✧ I couldn’t tell what animal it is — please add it."}
          </p>
        </div>
        <div className="rounded-card bg-frost px-3.5 py-1 shadow-soft md:bg-white md:px-5">
          <FRow label="Animal" ai={!!f.reading?.kind}>
            <input value={f.animal} onChange={(e) => setFound({ animal: e.target.value })} placeholder="Dog, cat… colour, size" className={cn(inputCls, f.reading?.kind && "shadow-[inset_0_0_0_1.5px_var(--pink)]")} />
          </FRow>
          <FRow label="Spot location">
            <input value={f.spot} onChange={(e) => setFound({ spot: e.target.value })} className={inputCls} />
            <span className="flex gap-1.5">
              <Pill on={map} onClick={() => setMap(!map)}>
                🗺 Fix on map
              </Pill>
            </span>
          </FRow>
          <FRow label="Time / date">
            <input value={f.time} onChange={(e) => setFound({ time: e.target.value })} className={inputCls} />
          </FRow>
          <FRow label="Collar / tag">
            <input value={f.collar} onChange={(e) => setFound({ collar: e.target.value })} className={inputCls} />
          </FRow>
          <FRow label="Notes">
            <textarea value={f.notes} onChange={(e) => setFound({ notes: e.target.value })} placeholder="Friendly, limping, small, wearing a red collar…" className={cn(inputCls, "field-sizing-content min-h-[42px] resize-none")} />
          </FRow>
        </div>
        {map && (
          <BuddyMap
            center={f.spotLL ?? DEFAULT_CENTER}
            zoom={16}
            hint="Tap where you found it"
            pins={f.spotLL ? [{ ll: f.spotLL, kind: "found" }] : []}
            onPick={async (ll) => setFound({ spotLL: ll, spot: (await placeName(ll)) || `Pin ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}` })}
          />
        )}
      </div>
      <div className="flex flex-col gap-3 md:pt-12">
        <SectionTitle>Where is the animal now?</SectionTitle>
        {NOW.map((n) => (
          <button
            key={n.k}
            type="button"
            aria-pressed={f.now === n.k}
            onClick={() => setFound({ now: n.k })}
            className="flex cursor-pointer flex-col gap-0.5 rounded-card bg-frost p-4 text-left shadow-soft aria-pressed:bg-navy aria-pressed:text-white md:bg-white"
          >
            <b className="text-[15px] font-extrabold">{n.title}</b>
            <span className="text-xs opacity-75">{n.text}</span>
          </button>
        ))}
        <Button disabled={!f.now || !f.animal.trim()} onClick={create} className="mt-2">
          {f.now === "seen" ? "Next: which way did it go?" : "Create report"}
        </Button>
        {!f.animal.trim() && <p className="text-xs text-muted-foreground">Add what animal it is to continue.</p>}
      </div>
    </div>
  )
}

/** Lost reports on this device that this found report could be (reverse check). */
function useLocalMatches() {
  const s = useBuddy()
  const r = currentFound(s)
  if (!r) return []
  return s.reports
    .filter((rep) => rep.status !== "reunited")
    .map((rep) => {
      const lost = bindReport(structuredClone(rep.draft)).lostForRule()
      const demo = localToDemo(r, rep.draft.lostPin ?? DEFAULT_CENTER)
      return demo ? { rep, v: ruleVerdict(lost, demo) } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x && x.v.verdict !== "no")
}

/* ---------- 23 · Report created · help more? ---------- */
export function FoundCreated() {
  const s = useBuddy()
  const hydrated = useHydrated()
  const r = currentFound(s)
  const matches = useLocalMatches()
  if (!r)
    return !hydrated ? null : (
      <AiNote>
        No found report yet. <Link href="/lost-found/found" className="underline">Start one</Link>
      </AiNote>
    )
  return (
    <div className="flex flex-col gap-4">
      <Clue state="success" width={130} alt="Clue is happy" className="self-center" />
      <PageTitle title="Report created">Owners nearby can now see it.</PageTitle>
      <div className="rounded-[20px] bg-white/85 p-4 shadow-soft">
        <p className="text-xs font-bold text-muted-foreground">✧ Status</p>
        <p className="mt-1 text-sm font-extrabold">Found report published</p>
        <p className="text-xs text-muted-foreground">
          Compared with {LOST_REPORTS.length + s.reports.length} lost reports · {matches.length ? `${matches.length} possible match` : "no match yet"}
        </p>
      </div>
      {matches.map(({ rep, v }) => (
        <Link
          key={rep.id}
          href="/lost-found/lost/match"
          onClick={() =>
            update((st) => {
              const x = st.reports.find((y) => y.id === rep.id)!
              const demo = localToDemo(r, x.draft.lostPin ?? DEFAULT_CENTER)!
              x.match = { ...v, f: demo, lost: bindReport(structuredClone(x.draft)).lostForRule(), desc: demo.desc, ll: r.spotLL ?? undefined, localId: r.id, photo: r.photo }
              x.status = "match"
              st.currentReport = x.id
            })
          }
          className="flex items-center gap-3 rounded-card bg-cream p-3 shadow-soft ring-1 ring-card-line/60"
        >
          <PetPhoto src={rep.draft.lostPhoto} emoji={speciesEmoji(rep.draft.species)} size={56} />
          <span>
            <Badge variant="match">{v.score} points</Badge>
            <b className="block text-sm">Could be {cap(petLabel(rep.draft))}, lost {field(rep.draft, "time").v || "recently"}</b>
          </span>
        </Link>
      ))}
      <SectionTitle>Do you want to help more?</SectionTitle>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LinkCard dark href="/lost-found/found/share" tag={<Badge variant="lost" className="text-xs">Yes</Badge>} title="Yes, share it" description="AI generates an image and link to share in your area." />
        <LinkCard href="/lost-found/found/thanks" tag={<Badge variant="found" className="text-xs">No</Badge>} title="No, I’m done" description="That’s already a big help." />
      </div>
    </div>
  )
}

/* ---------- 24 · Share + saved nearby ---------- */
export function FoundShare() {
  const s = useBuddy()
  const hydrated = useHydrated()
  const r = currentFound(s)
  const [notify, setNotify] = useState(true)
  if (!r)
    return !hydrated ? null : (
      <AiNote>
        No found report yet. <Link href="/lost-found/found" className="underline">Start one</Link>
      </AiNote>
    )
  const kind = (r.reading?.kind || r.animal.split(/[\s·]/)[0] || "pet").toLowerCase()
  const link = `buddy.app/f/${r.code}`
  const ll = r.spotLL ?? DEFAULT_CENTER
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-8">
      <div className="flex flex-col gap-4">
        <BackLink href="/lost-found/found/created">Report</BackLink>
        <PageTitle title={`Help this ${kind} get home`}>Share in your neighbourhood.</PageTitle>
        <div className="flex flex-col gap-3 rounded-card bg-frost p-4 shadow-soft md:bg-white">
          <div className="flex items-center justify-between gap-2">
            <span>
              <b className="block text-sm">Shareable link</b>
              <span className="text-xs text-muted-foreground">{link}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const text = `FOUND ${kind.toUpperCase()} near ${r.spot} · ${r.time}. ${r.animal}. ${link}`
                try {
                  if (navigator.share) await navigator.share({ title: `Found ${kind}`, text })
                  else {
                    await navigator.clipboard.writeText(text)
                    toast("Link copied")
                  }
                } catch {}
              }}
            >
              Share
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
            <span>
              <b className="block text-sm">Printable flyer / social template</b>
              <span className="text-xs text-muted-foreground">“FOUND” poster with the photo and a link.</span>
            </span>
            <Link href="/flyer?type=found" className="shrink-0 rounded-full bg-navy px-3.5 py-2 text-[13px] font-semibold text-white">
              View
            </Link>
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-[18px] bg-white/80 p-3.5 text-sm font-semibold shadow-soft">
          Notify me when a matching lost report appears
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-5 accent-navy" />
        </label>
        <Link href="/lost-found/found/thanks" className="inline-flex h-12 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-white shadow-btn">
          Done
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <b className="text-sm font-extrabold">Saved to reports near where you found it</b>
        <BuddyMap className="h-[260px] md:h-[400px]" center={ll} zoom={15} pins={[{ ll, kind: "found", label: r.spot, permanent: true }]} />
        <small className="text-xs text-muted-foreground">Owners searching this area will see your report first.</small>
      </div>
    </div>
  )
}

/* ---------- 25 · Good job, thank you ---------- */
export function FoundThanks() {
  return (
    <div className="flex flex-col items-center gap-4 pt-8 text-center">
      <Clue state="success" width={160} alt="Clue is happy" />
      <PageTitle title="Good job, thank you!">You may have just helped a pet get home. We’ll let you know if the owner is found.</PageTitle>
      <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full bg-navy px-8 text-[15px] font-semibold text-white shadow-btn">
        Back home
      </Link>
    </div>
  )
}

/* ---------- 26 · I only saw it → which way did it go? ---------- */
export function SightingRoute() {
  const s = useBuddy()
  const router = useRouter()
  const f = s.found
  const start = f.spotLL ?? DEFAULT_CENTER
  const route = f.route
  const save = () => {
    const id = uid()
    update((st) => {
      st.foundReports.unshift({ ...structuredClone(st.found), now: "seen", id, createdAt: Date.now(), code: id.slice(0, 4) })
      st.currentFound = id
    })
    router.push("/lost-found/found/sighting-map")
  }
  const pins: Pin[] = [{ ll: start, kind: "seen", label: "Seen here", permanent: true }, ...route.map((ll, i) => ({ ll, kind: (i === route.length - 1 ? "last" : "seen") as Pin["kind"] }))]
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/lost-found/found/check">Report</BackLink>
      <PageTitle title="Which way did it go?">Tap the map along the way it went. The last point is where you last saw it.</PageTitle>
      <BuddyMap className="h-[320px] md:h-[440px]" center={start} zoom={16} pins={pins} path={[start, ...route]} onPick={(ll) => setFound((x) => ({ route: [...x.route, ll] }))} hint="Tap where it went" />
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 text-muted-foreground">{route.length ? `${route.length} point${route.length > 1 ? "s" : ""} · ${fmtKm(route.reduce((a, p, i) => a + kmBetween(i ? route[i - 1] : start, p), 0))}` : "Seen here · tap where it went"}</span>
        <Button size="sm" variant="outline" disabled={!route.length} onClick={() => setFound((x) => ({ route: x.route.slice(0, -1) }))}>
          Undo
        </Button>
        <Button size="sm" variant="outline" disabled={!route.length} onClick={() => setFound({ route: [] })}>
          Clear
        </Button>
      </div>
      <Button onClick={save}>{route.length ? "Save sighting" : "Save — I don’t know where it went"}</Button>
    </div>
  )
}

/* ---------- 27 · Sighting · search area + vets & shelters ---------- */
export function SightingMap() {
  const s = useBuddy()
  const hydrated = useHydrated()
  const r = currentFound(s)
  if (!r)
    return !hydrated ? null : (
      <AiNote>
        No sighting yet. <Link href="/lost-found/found" className="underline">Report one</Link>
      </AiNote>
    )
  const start = r.spotLL ?? DEFAULT_CENTER
  const last = r.route.at(-1) ?? start
  const vets = nearestPlaces(last, 4)
  const kind = (r.reading?.kind || "pet").toLowerCase()
  const pins: Pin[] = [
    { ll: start, kind: "seen", label: "First seen" },
    { ll: last, kind: "last", label: "Last seen", permanent: true },
    ...vets.map((v) => ({ ll: v.ll, kind: v.kind, label: v.name }) as Pin),
  ]
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-3">
        <PageTitle title="Thanks — your sighting is saved">Owners looking for a {kind} nearby will see where it went.</PageTitle>
        <BuddyMap className="h-[300px] md:h-[440px]" center={last} zoom={15} pins={pins} path={[start, ...r.route]} circle={{ center: last, radius: 600 }} fit={[start, last, ...vets.slice(0, 2).map((v) => v.ll)]} />
        <MapKey items={[["seen", "Seen"], ["last", "Last seen"], ["vet", "Vets"], ["shelter", "Shelters"]]} />
        <p className="text-[13px] leading-[18px]">
          <b>Search area ~600 m</b> around the last point. If it’s no longer there, it may be brought to one of these — nearest first.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold">Vets & shelters nearby</h3>
        <ul className="flex flex-col gap-2">
          {vets.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-2 rounded-[16px] bg-white/85 p-3 text-sm shadow-soft">
              <span className="min-w-0">
                <b className="block truncate">{v.name}</b>
                <span className="text-xs text-muted-foreground">
                  {fmtKm(v.km)} · {v.hours}
                </span>
              </span>
              <Button size="sm" variant="outline" onClick={() => toast(`Calling ${v.name} (demo)`)}>
                Call
              </Button>
            </li>
          ))}
        </ul>
        <Link href="/lost-found/found/thanks" className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-white shadow-btn">
          Done
        </Link>
      </div>
    </div>
  )
}
