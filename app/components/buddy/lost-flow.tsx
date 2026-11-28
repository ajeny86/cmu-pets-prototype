"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { atBearing, CITY_LL, FOUND_REPORTS, LOST_REPORTS, TIPS, type LatLng } from "@/lib/ai/engine"
import { cap, counts, field, petLabel, setField, type LostDraft } from "@/lib/ai/story"
import { DEFAULT_CENTER, fmtKm, kmBetween, nearestPlaces } from "@/lib/demo-data"
import { findMatch, foundLL, sightings } from "@/lib/match"
import { signInDemo } from "@/lib/guide"
import { currentReport, uid, update, useBuddy, useHydrated } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Clue } from "@/components/buddy/clue"
import { AiNote, LinkCard, PetPhoto, SectionTitle, speciesEmoji, StatusSteps } from "@/components/buddy/kit"
import { BuddyMap, MapKey, placeLL, placeName, type Pin } from "@/components/buddy/map"
import { centerFor, Pill, Progress, ReportFields, setDraft, useCurrentLocation } from "@/components/buddy/lost-report"
import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/** Where the report is centred: the pin, else the city, else the demo city. */
function useCenter(d: LostDraft) {
  const [c, setC] = useState<LatLng>(d.lostPin ?? CITY_LL[field(d, "city").v.toLowerCase()] ?? DEFAULT_CENTER)
  const key = `${d.lostPin}|${field(d, "city").v}|${field(d, "lost").v}`
  useEffect(() => {
    let live = true
    centerFor(d).then((ll) => live && setC(ll))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the place changes
  }, [key])
  return c
}

/** Pages after the report need a report; send people back to the start if there's none. */
function useNeedReport() {
  const s = useBuddy()
  const ready = useHydrated()
  const router = useRouter()
  const r = currentReport(s)
  useEffect(() => {
    if (ready && !r) router.replace("/lost-found/lost/report")
  }, [ready, r, router])
  return r
}

/* ---------- 10 · Already a member? ---------- */
export function MemberChoice() {
  const s = useBuddy()
  const router = useRouter()
  const signIn = () => {
    signInDemo()
    toast("Signed in · your pet’s details are added from your profile")
    router.push("/lost-found/lost/quick")
  }
  return (
    <div className="flex flex-col gap-4 pt-2">
      <BackLink href="/lost-found">Lost & Found</BackLink>
      <PageTitle title="Are you already a member?">Members report in seconds — your pet’s profile is already saved.</PageTitle>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LinkCard
          dark
          onClick={signIn}
          tag={<Badge variant="lost" className="text-xs">Yes</Badge>}
          title={s.profile ? `Continue as ${s.profile.name}` : "Sign in · Lost button"}
          description="Your pet’s name, photo, chip and home area fill in automatically. Just add when and where."
        />
        <LinkCard
          href="/lost-found/lost/report"
          tag={<Badge variant="found" className="text-xs">No</Badge>}
          title="Continue as guest"
          description="No account needed. Tell the AI Guide what happened — by voice or text."
        />
      </div>
      <p className="text-xs text-muted-foreground">Demo: sign-in is simulated on this device, no password is asked.</p>
    </div>
  )
}

/* ---------- 13 · Member · Lost button (when + where only) ---------- */
export function QuickReport() {
  const s = useBuddy()
  const router = useRouter()
  const d = s.draft
  const pet = s.pets[0]
  const timeSet = !!field(d, "time").v
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Report your pet as lost">Your profile details are already in the report.</PageTitle>
      <Progress d={d} />
      <AiNote>
        I’ve added {pet ? `${pet.name}’s` : "your pet’s"} photo, chip and home area from your profile. I only need two things: when and where.
      </AiNote>
      <div className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
        <PetPhoto src={d.lostPhoto} emoji={speciesEmoji(d.species)} size={64} />
        <div className="min-w-0">
          <b className="block text-base font-extrabold">{petLabel(d)}</b>
          <span className="block text-xs text-muted-foreground">{[field(d, "species").v, d.photoBreed, field(d, "chip").v].filter(Boolean).join(" · ")}</span>
        </div>
        <Link href="/lost-found/lost/report" className="ml-auto shrink-0 text-xs font-semibold underline">
          Edit all
        </Link>
      </div>
      <SectionTitle>When did you last see {petLabel(d)}?</SectionTitle>
      <ReportFields d={d} keys={["time"]} />
      <Button disabled={!timeSet} onClick={() => router.push("/lost-found/lost/location")}>
        Next: where ↓
      </Button>
      {!pet && <p className="text-xs text-muted-foreground">No pet saved in your profile yet — add one in My pets.</p>}
    </div>
  )
}

/* ---------- 14 · Location clarification ---------- */
export function LocationStep() {
  const s = useBuddy()
  const router = useRouter()
  const d = s.draft
  const center = useCenter(d)
  const [mode, setMode] = useState<"point" | null>(d.lostPin ? "point" : null)
  const [query, setQuery] = useState("")
  const said = d.saidPlace || field(d, "lost").v
  const city = field(d, "city").v
  const candidates = useMemo(() => [said, said && city ? `${said}, ${city}` : null, city ? `${city} · city centre` : null].filter((x): x is string => !!x).filter((x, i, a) => a.indexOf(x) === i), [said, city])
  const chosen = field(d, "lost").v
  const choose = async (name: string) => {
    const ll = await placeLL(name.replace(" · city centre", ""), CITY_LL)
    setDraft((x) => {
      const n = setField(x, "lost", name, "ok")
      if (ll) n.lostPin = ll
      return n
    })
  }
  const here = useCurrentLocation((ll, name) =>
    setDraft((x) => {
      const n = setField(x, "lost", name || "My current location", "ok")
      n.lostPin = ll
      return n
    })
  )
  const missing = counts(d).missing
  const submit = () => {
    const id = uid()
    update((st) => {
      st.reports.unshift({ id, createdAt: Date.now(), draft: structuredClone(st.draft), status: "searching", match: null })
      st.currentReport = id
    })
    router.push("/lost-found/lost/searching")
  }
  const okToSubmit = !!(chosen || d.lostPin || city) && missing === 0
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Let’s find the right place">One step at a time. An approximate area is okay.</PageTitle>
      <Progress d={d} />
      <AiNote>
        {said
          ? `You said “${said}”. Pick the right place, or mark the exact spot where you last saw ${petLabel(d)}.`
          : `Where was ${petLabel(d)} last seen? Search for a place, use your location, or mark it on the map.`}
      </AiNote>
      <SectionTitle>Where was {petLabel(d)} last seen?</SectionTitle>
      {candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          {candidates.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={chosen === c}
              onClick={() => choose(c)}
              className="flex cursor-pointer items-center gap-2 rounded-[16px] bg-white px-3.5 py-3 text-left text-sm font-semibold text-navy shadow-soft aria-pressed:shadow-[inset_0_0_0_2px_var(--navy)]"
            >
              📍 {c}
              {chosen === c && <span className="ml-auto text-green">✓</span>}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim()) choose(query.trim())
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          list="loc-places"
          placeholder="⌕ Search another place or address"
          className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[15px] text-navy shadow-soft outline-none focus:shadow-[inset_0_0_0_1.5px_var(--navy)]"
        />
        <Button type="submit" variant="outline" className="h-11">
          Find
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Pill onClick={here}>📍 Use my current location</Pill>
        <Pill on={mode === "point"} onClick={() => setMode(mode ? null : "point")}>
          ⌖ Mark a point
        </Pill>
      </div>
      <BuddyMap
        className="h-[260px] md:h-[340px]"
        center={d.lostPin ?? center}
        zoom={15}
        hint={mode === "point" ? "Tap the map to mark the spot" : undefined}
        pins={d.lostPin ? [{ ll: d.lostPin, kind: "lost", label: chosen || "Last seen" }] : []}
        onPick={
          mode === "point"
            ? async (ll) => {
                const name = await placeName(ll)
                setDraft((x) => {
                  const n = setField(x, "lost", name || `Pin ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`, "ok")
                  n.lostPin = ll
                  return n
                })
              }
            : undefined
        }
      />
      <p className="text-xs text-muted-foreground">
        {chosen ? `Selected: ${chosen}` : "Possible places · none selected"} {missing ? `· ${missing} required detail${missing > 1 ? "s" : ""} still missing in the report` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!okToSubmit} onClick={submit}>
          Confirm & search
        </Button>
        <Button variant="outline" onClick={() => router.push(s.profile ? "/lost-found/lost/quick" : "/lost-found/lost/report")}>
          Back to the report
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Your home area stays private. Only the lost location is shown publicly.</p>
    </div>
  )
}

/* ---------- 15 · Report submitted · searching ---------- */
export function Searching() {
  const s = useBuddy()
  const r = useNeedReport()
  const router = useRouter()
  const center = useCenter(r?.draft ?? s.draft)
  if (!r) return null
  const d = r.draft
  const steps = [
    "Read your report",
    `Compared with ${FOUND_REPORTS.length + s.foundReports.length} found-pet reports nearby`,
    "Checked colour, size, place and time",
    "Ranked the closest matches",
  ]
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <Clue state="loading" width={140} alt="Clue is searching" />
      <PageTitle title="Report submitted">
        I’m looking for {petLabel(d)} in {field(d, "lost").v || field(d, "city").v || "your area"}.
      </PageTitle>
      <StatusSteps
        title="Searching for your post"
        steps={steps}
        className="w-full text-left"
        onDone={() => {
          const m = findMatch(d, center, s.foundReports)
          update((st) => {
            const rep = st.reports.find((x) => x.id === r.id)
            if (rep) {
              rep.match = m
              rep.status = m ? "match" : "no-match"
            }
          })
          router.replace(m ? "/lost-found/lost/match" : "/lost-found/lost/no-match")
        }}
      />
      <p className="text-xs text-muted-foreground">Immediate closest matches from lost & found reports nearby.</p>
    </div>
  )
}

/* ---------- 16 · Is this your pet? ---------- */
export function MatchStep() {
  const r = useNeedReport()
  const router = useRouter()
  if (!r) return null
  const m = r.match
  if (!m)
    return (
      <AiNote>
        No match to show. <Link href="/lost-found/lost/no-match" className="underline">See your report</Link>
      </AiNote>
    )
  const n = cap(petLabel(r.draft))
  const answer = (yes: boolean) => {
    update((st) => {
      const rep = st.reports.find((x) => x.id === r.id)!
      rep.status = yes ? "reunited" : "no-match"
      rep.rejected = !yes
    })
    router.push(yes ? "/lost-found/lost/reunite" : "/lost-found/lost/no-match")
  }
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/lost-found/lost/report">My report</BackLink>
      <PageTitle title={`Is this ${n}?`}>We found 1 possible match. You decide — nothing is shared until you confirm.</PageTitle>
      <div className="flex flex-col gap-2.5 rounded-card bg-cream p-3 shadow-soft ring-1 ring-card-line/60 md:p-5">
        <div className="flex gap-3">
          <PetPhoto src={m.photo} emoji={speciesEmoji(m.f.sp)} size={96} />
          <div className="flex flex-col gap-1.5">
            <Badge variant="match">Match · {m.score} points</Badge>
            <b className="text-[15px] font-extrabold">{cap(m.desc)}</b>
            <span className="text-xs leading-4 text-muted-foreground">
              Reported {m.f.daysAgo ? `${m.f.daysAgo} day${m.f.daysAgo > 1 ? "s" : ""} ago` : "today"} near {m.f.where} · in the finder’s care
            </span>
          </div>
        </div>
        <ul className="flex flex-col gap-[3px] text-[12px] leading-[16px] text-muted-foreground">
          <li>
            <b className="font-semibold text-navy">Why this match</b>
          </li>
          {m.clues.map(([c, p]) => (
            <li key={c}>
              {p > 0 ? "✓" : "–"} {c} <span className="text-periwinkle-2">· {p > 0 ? `+${p}` : p}</span>
            </li>
          ))}
          {!r.draft.lostPhoto && <li>? No photo in your report — compare carefully</li>}
        </ul>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <Button className="md:flex-1" onClick={() => answer(true)}>
          Yes, it’s {n}
        </Button>
        <Button variant="outline" className="md:flex-1" onClick={() => answer(false)}>
          No, not my pet
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Confirming opens a private chat. Phone numbers and addresses stay hidden.</p>
    </div>
  )
}

/* ---------- 17 · Match → reunite ---------- */
export function Reunite() {
  const s = useBuddy()
  const r = useNeedReport()
  const center = useCenter(r?.draft ?? s.draft)
  if (!r) return null
  const n = cap(petLabel(r.draft))
  const lost = r.draft.lostPin ?? center
  const found = r.match ? foundLL(r.match, lost) : null
  const mid: LatLng | null = found ? [(lost[0] + found[0]) / 2 + 0.001, (lost[1] + found[1]) / 2] : null
  const pins: Pin[] = [{ ll: lost, kind: "lost", label: "Lost here" }]
  if (mid) pins.push({ ll: mid, kind: "seen", label: "Sighting" })
  if (found) pins.push({ ll: found, kind: "found", label: "Found here", permanent: true })
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-8">
      <div className="flex flex-col gap-4">
        <Clue state="success" width={130} alt="Clue is happy" className="self-center md:self-start" />
        <PageTitle title={`${n} is marked as found`}>Great news. Here’s how to reunite safely.</PageTitle>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-[19px]">
          <li>Message the finder in the private chat — no phone number needed.</li>
          <li>Agree on a public place to meet, or a vet nearby.</li>
          <li>Bring proof: photos of your pet, vet record or chip number.</li>
          <li>Ask a vet to scan the chip if you’re unsure.</li>
        </ol>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button onClick={() => toast("Private chat opened with the finder (demo)")}>Message the finder</Button>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full bg-white/85 px-[22px] text-[15px] font-semibold text-navy shadow-soft">
            Back home
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <b className="text-sm font-extrabold">Where {n} has been</b>
        <BuddyMap className="h-[260px] md:h-[420px]" center={lost} pins={pins} path={[lost, ...(mid ? [mid] : []), ...(found ? [found] : [])]} fit={pins.map((p) => p.ll)} />
        <MapKey items={[["lost", "Lost"], ["seen", "Seen"], ["found", "Found"]]} />
        <p className="text-xs text-muted-foreground">Timeline from your report, a sighting and the finder’s report.</p>
      </div>
    </div>
  )
}

/* ---------- 18 · No match yet ---------- */
const LAYERS = ["Lost pets", "Found pets", "Vets & shelters"] as const

export function NoMatch() {
  const s = useBuddy()
  const r = useNeedReport()
  const router = useRouter()
  const center = useCenter(r?.draft ?? s.draft)
  const [layers, setLayers] = useState<string[]>([...LAYERS])
  const [showAll, setShowAll] = useState(false)
  const [contact, setContact] = useState("")
  if (!r) return null
  const d = r.draft
  const n = cap(petLabel(d))
  const sp = (d.species || "pet").toLowerCase()
  const city = field(d, "city").v || "your area"
  const base = d.lostPin ?? center
  const phone = field(d, "contact").v
  const tips = [...(typeof TIPS[sp] === "string" ? [TIPS[sp] as string] : []), ...TIPS.common].map((t) => t.replace("{n}", n))
  const vets = nearestPlaces(base, showAll ? 5 : 3)
  const pins: Pin[] = [{ ll: base, kind: "lost", label: `${n} · last seen`, permanent: true }]
  if (layers.includes("Lost pets")) LOST_REPORTS.forEach((l) => pins.push({ ll: atBearing(base, l.km, l.bearing), kind: "lost", label: l.desc }))
  if (layers.includes("Found pets")) FOUND_REPORTS.forEach((f) => pins.push({ ll: atBearing(base, f.km, f.bearing), kind: "found", label: `Found · ${f.desc}` }))
  if (layers.includes("Vets & shelters")) vets.forEach((v) => pins.push({ ll: v.ll, kind: v.kind, label: v.name }))
  const share = async () => {
    const text = `LOST ${sp.toUpperCase()}: ${n}. ${field(d, "traits").v} Last seen ${[field(d, "lost").v, field(d, "city").v].filter(Boolean).join(", ")} · ${field(d, "time").v}.${phone ? ` Call ${phone}.` : ""}`
    try {
      if (navigator.share) await navigator.share({ title: `Lost ${sp}: ${n}`, text })
      else {
        await navigator.clipboard.writeText(text)
        toast("Post text copied — paste it in your local groups")
      }
    } catch {}
  }
  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start md:gap-8">
      <div className="flex flex-col gap-5">
        <PageTitle title={`No match yet for ${n}`}>
          {r.rejected
            ? `OK — that wasn’t ${n}. The report stays live in ${city} and I keep comparing new reports.`
            : `Your report is live in ${city}. I compared it with found-pet reports nearby — none look like ${n} yet.`}
        </PageTitle>

        <Link href="/lost-found/lost/seen" className="flex items-center gap-3 rounded-card bg-navy p-3.5 text-white shadow-lift">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pink text-lg">👀</span>
          <span className="min-w-0">
            <b className="block text-sm font-extrabold">New sighting · 25 min ago</b>
            <span className="block text-xs text-[#c3cbea]">Someone saw a {sp} like {n} near the last sighting</span>
          </span>
          <span className="ml-auto">→</span>
        </Link>

        <section className="flex flex-col gap-3">
          <h3 className="text-base font-extrabold">Your lost pet report</h3>
          <Link href="/lost-found/lost/report" className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
            <PetPhoto src={d.lostPhoto} emoji={speciesEmoji(sp)} size={72} />
            <span className="flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground">
              <Badge variant="lost" className="text-[11px]">Lost {sp}</Badge>
              <b className="text-base font-extrabold text-navy">{n}</b>
              {field(d, "time").v && <span>📅 {field(d, "time").v}</span>}
              <span>📍 {[field(d, "lost").v, field(d, "city").v].filter(Boolean).join(", ") || "Place not set"}</span>
              {(field(d, "traits").v || d.photoLook) && <span className="line-clamp-2">✧ {field(d, "traits").v || d.photoLook}</span>}
            </span>
            <span className="ml-auto text-lg text-periwinkle">›</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={share}>
              Share post
            </Button>
            <Link href="/flyer?type=lost" className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-navy px-4 text-[15px] font-semibold text-white shadow-btn">
              Print poster
            </Link>
          </div>
          {!phone && (
            <div className="flex flex-col gap-2 rounded-[18px] bg-white/80 p-3.5 shadow-soft">
              <b className="text-sm">Want a poster to print and put up?</b>
              <p className="text-xs text-muted-foreground">Add a phone — people on the street can only call.</p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!/^\+?[\d\s()-]{7,}$/.test(contact)) return toast("Add a phone number, e.g. +351 900 000 000")
                  update((st) => {
                    const rep = st.reports.find((x) => x.id === r.id)!
                    rep.draft = setField(rep.draft, "contact", contact)
                    st.draft = rep.draft
                  })
                  toast("Added to your poster")
                }}
              >
                <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+351 900 000 000" className="h-10 min-w-0 flex-1 rounded-full bg-white px-3.5 text-sm shadow-soft outline-none" />
                <Button type="submit" className="h-10">
                  Add
                </Button>
              </form>
            </div>
          )}
          <p className="text-xs text-green-dark">
            {s.profile ? `✓ We’ll notify your buddy account if a found pet looks like ${n}.` : phone ? `✓ We’ll let you know at ${phone} if a found pet looks like ${n}.` : ""}
          </p>
          {!s.profile && (
            <AiNote title="Keep searching with a free account">
              Instant alerts when a found pet nearby looks like {n}, private chat with finders, and your report in one place.{" "}
              <Link href="/signup" className="font-bold underline">
                Create account
              </Link>
            </AiNote>
          )}
        </section>

        <details className="rounded-card bg-white/70 p-4 shadow-soft">
          <summary className="cursor-pointer font-extrabold">What to do in the next 24 hours</summary>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-[19px]">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">If people report sightings in different places, I’ll map where {n} may be moving.</p>
        </details>
        <Button variant="outline" onClick={() => router.push("/lost-found/lost/report")}>
          Edit my report
        </Button>
      </div>

      <section className="flex flex-col gap-3 md:sticky md:top-24">
        <BuddyMap className="h-[260px] md:h-[400px]" center={base} zoom={14} pins={pins} />
        <div className="flex flex-wrap gap-1.5">
          {LAYERS.map((l) => (
            <Pill key={l} on={layers.includes(l)} onClick={() => setLayers(layers.includes(l) ? layers.filter((x) => x !== l) : [...layers, l])}>
              {l}
            </Pill>
          ))}
        </div>
        <SectionTitle
          action={
            <button type="button" className="cursor-pointer text-[13px] font-semibold text-muted-foreground" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less" : "See all →"}
            </button>
          }
        >
          <span className="text-base">Vets & shelters nearby</span>
        </SectionTitle>
        <ul className="flex flex-col gap-2">
          {vets.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-[16px] bg-white/85 p-3 shadow-soft">
              <span className={cn("grid size-9 place-items-center rounded-full text-base", v.kind === "vet" ? "bg-topic-green" : "bg-teal-soft")}>{v.kind === "vet" ? "🩺" : "🏠"}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm">{v.name}</b>
                <span className="block text-xs text-muted-foreground">
                  {fmtKm(v.km)} · {v.hours}
                </span>
              </span>
              <Button size="sm" variant="outline" onClick={() => toast(`Calling ${v.name} (demo)`)}>
                Call
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* ---------- 18a · Seen, not caught · Is this Max? ---------- */
const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

function useSeen() {
  const s = useBuddy()
  const r = currentReport(s)
  const d = r?.draft ?? s.draft
  const center = useCenter(d)
  const base = d.lostPin ?? center
  const data = sightings(base)
  const name = r ? cap(petLabel(d)) : "Max"
  return { r, d, data, name, sp: (d.species || "dog").toLowerCase() }
}

export function SeenMatch() {
  const { d, data, name, sp } = useSeen()
  const km = kmBetween(data.base, data.pts[2])
  const own = !!d.lostPhoto
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/lost-found/lost/no-match">My report</BackLink>
      <Link href="/lost-found/lost/seen-map" className="flex items-center gap-3 rounded-card bg-navy p-3 text-white shadow-lift">
        <span className="grid size-9 place-items-center rounded-full bg-pink">👀</span>
        <span>
          <b className="block text-sm">New sighting · {data.mins} min ago</b>
          <span className="text-xs text-[#c3cbea]">Someone saw a {sp} like {name} near the last sighting</span>
        </span>
      </Link>
      <PageTitle title={`Is this ${name}?`}>
        {data.pts.length} people saw a {sp} like {name} today. Nobody could take it in — it ran off when they came closer.
      </PageTitle>
      <section className="flex flex-col gap-3 rounded-card bg-cream p-3.5 shadow-soft ring-1 ring-card-line/60 md:p-5">
        <div className="flex gap-3">
          <PetPhoto src={own ? d.lostPhoto : null} emoji={speciesEmoji(sp)} size={84} />
          <div className="flex flex-col gap-1">
            <Badge variant="match">Seen · not caught</Badge>
            <b className="text-sm font-extrabold">{cap([d.photoColour, sp].filter(Boolean).join(" "))}</b>
            <span className="text-xs text-muted-foreground">{data.mins} min ago · near the last sighting</span>
          </div>
        </div>
        <div className="flex gap-2">
          {data.times.map((t, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <span className="grid size-14 place-items-center rounded-[12px] bg-sage text-2xl">{speciesEmoji(sp)}</span>
              <small className="text-[10.5px] text-muted-foreground">
                {hhmm(t)}
                {i === 2 ? " · latest" : ""}
              </small>
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-[12px] text-muted-foreground">
          <li>
            <b className="text-navy">Why we think it’s {name}</b>
          </li>
          <li>✓ Same colour and size as in your photo</li>
          <li>
            ✓ Seen {fmtKm(km)} from where {name} went missing
          </li>
          <li>✓ All sightings are after {name} went missing</li>
          <li>? Collar seen, tag not readable from a distance</li>
        </ul>
      </section>
      <div className="flex flex-col gap-2 md:flex-row">
        <Link href="/lost-found/lost/seen-map" className="inline-flex h-12 items-center justify-center rounded-full bg-navy px-5 text-[15px] font-semibold text-white shadow-btn md:flex-1">
          Yes, it’s {name} — show where
        </Link>
        <Link href="/lost-found/lost/no-match" className="inline-flex h-12 items-center justify-center rounded-full bg-white/85 px-5 text-[15px] font-semibold text-navy shadow-soft md:flex-1">
          No, not my {sp}
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">People who saw {name} can’t see your phone number. You can message them from the next screen.</p>
    </div>
  )
}

/* ---------- 18b · Last seen here · search area + vets ---------- */
export function SeenMap() {
  const { data, name } = useSeen()
  const [names, setNames] = useState<(string | null)[]>([])
  const key = data.pts.map((p) => p.join(",")).join("|")
  useEffect(() => {
    let live = true
    Promise.all(key.split("|").map((p) => placeName(p.split(",").map(Number) as LatLng))).then((n) => live && setNames(n))
    return () => {
      live = false
    }
  }, [key])
  const last = data.pts[2]
  const vets = nearestPlaces(last, 3)
  const pins: Pin[] = [
    { ll: data.base, kind: "lost", label: "Lost" },
    { ll: data.pts[0], kind: "seen", label: `Seen ${hhmm(data.times[0])}` },
    { ll: data.pts[1], kind: "seen", label: `Seen ${hhmm(data.times[1])}` },
    { ll: last, kind: "last", label: "Last seen", permanent: true },
    ...vets.map((v) => ({ ll: v.ll, kind: v.kind, label: v.name }) as Pin),
  ]
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-3 md:sticky md:top-24">
        <BackLink href="/lost-found/lost/seen">Sighting</BackLink>
        <PageTitle title={`${name} was last seen here`}>
          {data.mins} min ago · {names[2] ? `near ${names[2]}` : "near the last sighting"}. Nobody took {name} in, so they’re most likely still close by.
        </PageTitle>
        <BuddyMap className="h-[300px] md:h-[440px]" center={last} zoom={15} pins={pins} circle={{ center: last, radius: data.radius }} path={[data.base, ...data.pts]} fit={[data.base, ...data.pts]} />
        <MapKey items={[["lost", "Lost"], ["seen", "Seen"], ["last", "Last seen"], ["vet", "Vets & shelters"]]} />
        <p className="text-[13px] leading-[18px]">
          <b>Search within ~{data.radius} m</b> of the last sighting. The circle grows the longer it’s been — scared pets usually stay within about 1 km and hide during the day.
        </p>
        <div className="flex gap-2">
          <a
            href={`https://www.openstreetmap.org/directions?to=${last[0].toFixed(5)},${last[1].toFixed(5)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-navy px-4 text-[15px] font-semibold text-white shadow-btn"
          >
            Directions
          </a>
          <Button variant="outline" className="flex-1" onClick={() => toast(`Chat opened with the ${data.pts.length} people who saw ${name} (demo)`)}>
            Message them
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="text-base font-extrabold">Where {name} was seen</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {data.pts.map((p, i) => (
              <li key={i} className="flex items-center gap-3 rounded-[16px] bg-white/85 p-3 text-sm shadow-soft">
                <b className="w-12 shrink-0">{hhmm(data.times[i])}</b>
                <span className="min-w-0 flex-1 truncate">{names[i] || `${p[0].toFixed(4)}, ${p[1].toFixed(4)}`}</span>
                {i === 2 && <Badge variant="lost">latest</Badge>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-base font-extrabold">Vets & shelters nearby</h3>
          <p className="text-xs text-muted-foreground">Someone may have brought {name} in, or will. Nearest to where they were last seen:</p>
          <ul className="mt-2 flex flex-col gap-2">
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
        </section>
        <details open className="rounded-card bg-white/70 p-4 shadow-soft">
          <summary className="cursor-pointer font-extrabold">How to get a scared pet back</summary>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-[19px]">
            <li><b>Don’t chase or call loudly.</b> A frightened pet runs even from its owner.</li>
            <li><b>Go to the last spot and sit down sideways.</b> Talk softly, don’t look straight at them.</li>
            <li><b>Bring something that smells of home</b> — a blanket, your T-shirt, favourite treats.</li>
            <li><b>Leave water and food there</b> if they don’t come. Pets often return to the same place at dawn and dusk.</li>
            <li><b>Ask people who see them to keep their distance</b> and send a new sighting instead.</li>
          </ul>
        </details>
        <Button onClick={() => toast("We’ll notify you about every new sighting")}>I’m going there</Button>
      </div>
    </div>
  )
}
