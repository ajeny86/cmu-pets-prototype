"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { applyProfile, cap, field, freshDraft, petLabel } from "@/lib/ai/story"
import { readPhoto, shrinkPhoto } from "@/lib/ai/photo"
import { ADOPTION } from "@/lib/demo-data"
import { resetAll, signUp, uid, update, useBuddy, useHydrated, type MyPet, type Profile } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Clue } from "@/components/buddy/clue"
import { AiNote, PetPhoto, PhotoPicker, SectionTitle, speciesEmoji } from "@/components/buddy/kit"
import { PageTitle } from "@/components/buddy/page-title"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function TextInput({ id, label, value, onChange, type = "text", placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function ProfileForm({ initial, submit, cta }: { initial: Profile; submit: (p: Profile) => void; cta: string }) {
  const [p, setP] = useState(initial)
  const set = (k: keyof Profile) => (v: string) => setP({ ...p, [k]: v })
  const valid = p.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)
  return (
    <form
      className="flex flex-col gap-3 rounded-card bg-frost p-4 shadow-soft md:bg-white md:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) submit(p)
        else toast("Add your name and a valid email")
      }}
    >
      <TextInput id="name" label="Your name" value={p.name} onChange={set("name")} placeholder="First name" />
      <TextInput id="email" label="Email" type="email" value={p.email} onChange={set("email")} placeholder="name@example.com" />
      <TextInput id="phone" label="Phone (optional · only shown to finders)" type="tel" value={p.phone} onChange={set("phone")} placeholder="+351 900 000 000" />
      <TextInput id="city" label="City" value={p.city} onChange={set("city")} placeholder="Lisbon" />
      <Button type="submit" className="mt-1">
        {cta}
      </Button>
    </form>
  )
}

export function SignUp() {
  const s = useBuddy()
  const router = useRouter()
  const [demoPet, setDemoPet] = useState(true)
  const hydrated = useHydrated()
  if (hydrated && s.profile)
    return (
      <AiNote title="✓  You’re signed in">
        Signed in as {s.profile.name}. <Link href="/profile" className="underline">Open your profile</Link>
      </AiNote>
    )
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-8">
      <div className="flex flex-col gap-3">
        <Clue state="hello" width={120} />
        <PageTitle title="Create account">Save your pets and get alerts when someone finds them.</PageTitle>
        <ul className="flex flex-col gap-1.5 text-[13.5px]">
          <li>✓ Report a lost pet in seconds with the Lost button</li>
          <li>✓ Instant alerts when a found pet nearby looks like yours</li>
          <li>✓ Private chat with finders — no phone number shared</li>
        </ul>
        <p className="text-xs text-muted-foreground">Demo: the account is kept on this device only, no password and nothing is sent anywhere.</p>
      </div>
      <div className="flex flex-col gap-3">
        <ProfileForm
          initial={{ name: "", email: "", phone: "", city: "Lisbon" }}
          cta="Create account"
          submit={(p) => {
            signUp(p, demoPet)
            toast(`Welcome, ${p.name}!`)
            router.push("/pets")
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={demoPet} onChange={(e) => setDemoPet(e.target.checked)} className="size-4 accent-navy" />
          Add the demo pet (Max, a dachshund) to try the Lost button
        </label>
      </div>
    </div>
  )
}

function PetForm({ onSave, onCancel }: { onSave: (p: MyPet) => void; onCancel: () => void }) {
  const [p, setP] = useState<MyPet>({ id: uid(), name: "", species: "", breed: "", colour: "", traits: "", chip: "", city: "", home: "Saved in your profile · private", photo: "" })
  const [note, setNote] = useState<string | null>(null)
  const set = (k: keyof MyPet) => (v: string) => setP((x) => ({ ...x, [k]: v }))
  return (
    <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft md:p-6">
      <div className="flex items-center gap-3">
        <PetPhoto src={p.photo || null} emoji={speciesEmoji(p.species)} size={72} />
        <div className="flex flex-col gap-1.5">
          <PhotoPicker
            variant="outline"
            label="Add photo"
            className="h-9 px-3.5 text-[13px]"
            onFile={async (f) => {
              const url = await shrinkPhoto(f)
              setP((x) => ({ ...x, photo: url }))
              setNote("AI is looking at the photo…")
              const r = await readPhoto(url)
              setP((x) => ({ ...x, species: x.species || r.kind || "", breed: x.breed || r.breed || "", colour: x.colour || cap(r.colour || "") }))
              setNote(r.kind ? `✧ Looks like a ${r.kind.toLowerCase()}${r.breed ? ` (${r.breed})` : ""} — check the details` : "✧ Couldn’t read the photo — add the details yourself")
            }}
          />
          {note && <span className="text-xs font-semibold text-pink-ink">{note}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextInput id="pn" label="Name" value={p.name} onChange={set("name")} />
        <TextInput id="ps" label="Animal" value={p.species} onChange={set("species")} placeholder="Dog, cat…" />
        <TextInput id="pb" label="Breed" value={p.breed} onChange={set("breed")} />
        <TextInput id="pc" label="Colour" value={p.colour} onChange={set("colour")} />
        <TextInput id="pt" label="Special features" value={p.traits} onChange={set("traits")} />
        <TextInput id="pm" label="Microchip / collar" value={p.chip} onChange={set("chip")} />
      </div>
      <div className="flex gap-2">
        <Button disabled={!p.name.trim() || !p.species.trim()} onClick={() => onSave(p)}>
          Save pet
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

const STATUS: Record<string, string> = { searching: "Searching", match: "Possible match", "no-match": "Live · no match yet", reunited: "Reunited ✓" }

export function MyPets() {
  const s = useBuddy()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const lostButton = (p: MyPet) => {
    // a fresh report from this pet's profile
    update((st) => {
      st.currentReport = null
      st.draft = applyProfile(freshDraft(), p, st.profile?.phone || st.profile?.email || "").draft
    })
    router.push("/lost-found/lost/quick")
  }
  const favs = ADOPTION.filter((a) => s.favourites.includes(a.id))
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="My pets">Your pets’ profiles, reports and reminders — saved on this device.</PageTitle>

      <section className="flex flex-col gap-3">
        <SectionTitle action={s.profile && !adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}>+ Add pet</Button>}>Pets</SectionTitle>
        {!s.profile && (
          <AiNote>
            Create a free account to save your pets — then one tap on the Lost button reports them. <Link href="/signup" className="font-bold underline">Create account</Link>
          </AiNote>
        )}
        {adding && (
          <PetForm
            onCancel={() => setAdding(false)}
            onSave={(p) => {
              update((st) => void st.pets.push({ ...p, city: p.city || st.profile?.city || "" }))
              setAdding(false)
              toast(`${p.name} saved`)
            }}
          />
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {s.pets.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
              <PetPhoto src={p.photo || null} emoji={speciesEmoji(p.species)} size={64} />
              <div className="min-w-0 flex-1">
                <b className="block text-base font-extrabold">{p.name}</b>
                <span className="block truncate text-xs text-muted-foreground">{[p.species, p.breed, p.colour].filter(Boolean).join(" · ")}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button size="sm" className="bg-pink text-white shadow-none hover:bg-pink hover:brightness-105" onClick={() => lostButton(p)}>
                  Lost
                </Button>
                <button type="button" className="cursor-pointer text-[11px] text-muted-foreground underline" onClick={() => confirm(`Remove ${p.name}?`) && update((st) => void (st.pets = st.pets.filter((x) => x.id !== p.id)))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Reports</SectionTitle>
        {!s.reports.length && !s.foundReports.length && <p className="text-sm text-muted-foreground">No reports yet. Lost or found reports you make show up here.</p>}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {s.reports.map((r) => (
            <Link
              key={r.id}
              href={r.status === "match" ? "/lost-found/lost/match" : r.status === "reunited" ? "/lost-found/lost/reunite" : "/lost-found/lost/no-match"}
              onClick={() => update((st) => { st.currentReport = r.id; st.draft = r.draft })}
              className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white"
            >
              <PetPhoto src={r.draft.lostPhoto} emoji={speciesEmoji(r.draft.species)} size={52} />
              <span className="min-w-0">
                <Badge variant="lost" className="text-[11px]">lost</Badge>
                <b className="block text-sm">{cap(petLabel(r.draft))}</b>
                <span className="block truncate text-xs text-muted-foreground">{[STATUS[r.status], field(r.draft, "city").v, new Date(r.createdAt).toLocaleDateString("en-GB")].filter(Boolean).join(" · ")}</span>
              </span>
            </Link>
          ))}
          {s.foundReports.map((r) => (
            <Link key={r.id} href={r.now === "seen" ? "/lost-found/found/sighting-map" : "/lost-found/found/share"} onClick={() => update((st) => void (st.currentFound = r.id))} className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
              <PetPhoto src={r.photo} emoji={speciesEmoji(r.reading?.kind)} size={52} />
              <span className="min-w-0">
                <Badge variant="found" className="text-[11px]">{r.now === "seen" ? "sighting" : "found"}</Badge>
                <b className="block truncate text-sm">{r.animal || "Animal"}</b>
                <span className="block truncate text-xs text-muted-foreground">{[r.spot, new Date(r.createdAt).toLocaleDateString("en-GB")].filter(Boolean).join(" · ")}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {(s.requests.length > 0 || favs.length > 0) && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Requests & saved</SectionTitle>
          <ul className="flex flex-col gap-2">
            {s.requests.map((r) => (
              <li key={r.id} className="flex justify-between gap-2 rounded-[16px] bg-white/85 p-3 text-sm shadow-soft">
                <span>{r.kind === "visit" ? `Visit request · ${r.title}` : `Booking · ${r.title}`}</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </li>
            ))}
            {favs.map((a) => (
              <li key={a.id}>
                <Link href={`/adoption/${a.id}`} className="flex justify-between gap-2 rounded-[16px] bg-white/85 p-3 text-sm shadow-soft">
                  <span>♥ {a.name} · {a.title}</span>
                  <span className="text-xs text-muted-foreground">Adoption</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function ProfilePage() {
  const s = useBuddy()
  const router = useRouter()
  const hydrated = useHydrated()
  if (!hydrated) return null
  if (!s.profile)
    return (
      <div className="flex flex-col items-center gap-4 pt-6 text-center">
        <Clue state="empty" width={140} />
        <PageTitle title="Profile">You’re browsing as a guest.</PageTitle>
        <Link href="/signup" className="inline-flex h-12 items-center rounded-full bg-pink px-6 text-[15px] font-bold text-white">
          Create account
        </Link>
      </div>
    )
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Profile">Your account and contact details.</PageTitle>
      <ProfileForm
        key={s.profile.email}
        initial={s.profile}
        cta="Save changes"
        submit={(p) => {
          update((st) => void (st.profile = p))
          toast("Profile saved")
        }}
      />
      <Button
        variant="outline"
        onClick={() => {
          update((st) => void (st.profile = null))
          toast("Signed out — your pets and reports stay on this device")
          router.push("/")
        }}
      >
        Sign out
      </Button>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-line/70 py-3 last:border-0">
      <span>
        <b className="block text-sm">{label}</b>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-navy" />
    </label>
  )
}

export function SettingsPage() {
  const s = useBuddy()
  const set = (k: keyof typeof s.settings) => (v: boolean) => update((st) => void (st.settings[k] = v))
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Settings">Notifications, privacy and the on-device AI.</PageTitle>
      <section className="rounded-card bg-frost px-4 py-1 shadow-soft md:bg-white md:px-6">
        <Toggle label="Match alerts" hint="When a found pet looks like yours" checked={s.settings.matchAlerts} onChange={set("matchAlerts")} />
        <Toggle label="Sighting alerts" hint="New sightings near your lost report" checked={s.settings.sightingAlerts} onChange={set("sightingAlerts")} />
        <Toggle label="Tips & news" checked={s.settings.newsletter} onChange={set("newsletter")} />
      </section>
      <Link href="/ai-lab" className="flex items-center justify-between rounded-card bg-topic-pink p-4 shadow-soft">
        <span>
          <b className="block text-sm text-pink-ink">✧ AI lab</b>
          <span className="text-xs text-navy">Test the photo, text and matching AI on this device</span>
        </span>
        →
      </Link>
      <section className="flex flex-col gap-2 rounded-card bg-white/70 p-4 shadow-soft">
        <b className="text-sm">Privacy</b>
        <p className="text-xs text-muted-foreground">
          Everything — reports, photos, pets and chat — is saved in this browser only. Photos are analysed on this device. Maps load tiles and place names from OpenStreetMap.
        </p>
        <Button
          variant="destructive"
          className="self-start"
          onClick={() => {
            if (confirm("Delete all buddy data saved in this browser? This can’t be undone.")) {
              resetAll()
              toast("All data on this device was deleted")
            }
          }}
        >
          Reset demo data
        </Button>
      </section>
    </div>
  )
}
