"use client"

import Link from "next/link"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { firstMatch, SHOP_CATS, SVC_TOPICS } from "@/lib/ai/engine"
import {
  ADOPT_FILTERS,
  ADOPTION,
  adoptMatches,
  PRODUCTS,
  SERVICE_TOPICS,
  SERVICES,
  serviceTip,
  SHOP_CATEGORIES,
  type AdoptFilter,
  type AdoptPet,
  type Product,
  type Service,
} from "@/lib/demo-data"
import { uid, update, useBuddy } from "@/lib/store"
import { toast } from "@/lib/toast"
import { AiNote, Chips } from "@/components/buddy/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const speciesOf = (q?: string | null) =>
  !q ? null : /(dog|puppy|собак|щен|пёс|пес)/i.test(q) ? "dog" : /(cat|kitten|кош|кот)/i.test(q) ? "cat" : null

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-[0_3px_10px_rgb(16_40_139/0.07)] focus-within:shadow-[inset_0_0_0_1.5px_var(--navy)]">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5a6696" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l4.5 4.5" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[15px] text-navy outline-none placeholder:text-periwinkle-2" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="cursor-pointer text-muted-foreground">
          ✕
        </button>
      )}
    </label>
  )
}

function YouAsked({ answer }: { answer: string }) {
  const s = useBuddy()
  if (!s.query) return null
  return (
    <AiNote>
      <p className="text-muted-foreground italic">You asked: “{s.query}”</p>
      <p className="mt-1">{answer}</p>
      <button type="button" onClick={() => update((st) => void (st.query = null))} className="mt-1.5 cursor-pointer text-xs font-semibold text-muted-foreground underline">
        Clear
      </button>
    </AiNote>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-card bg-white/70 p-6 text-center text-sm text-muted-foreground md:col-span-full">{children}</p>
)

/* ---------- 05 · Adoption ---------- */
export function AdoptionList() {
  const s = useBuddy()
  const q = s.query || ""
  const sp = speciesOf(q)
  const initial: AdoptFilter = /(kitten|котён|котен)/i.test(q) ? "Kittens" : /(puppy|щен)/i.test(q) ? "Puppies" : sp === "dog" ? "Dogs" : sp === "cat" ? "Cats" : "All"
  const [picked, setFilter] = useState<AdoptFilter | null>(null)
  const filter = picked ?? initial
  const [text, setText] = useState("")
  const [favOnly, setFavOnly] = useState(false)
  const list = ADOPTION.filter(
    (a) => adoptMatches(a, filter) && (!favOnly || s.favourites.includes(a.id)) && (!text || `${a.name} ${a.title} ${a.meta}`.toLowerCase().includes(text.toLowerCase()))
  )
  return (
    <div className="flex flex-col gap-4">
      <YouAsked answer={`I’ve filtered pets for adoption: ${filter.toLowerCase()}. Tap one to arrange a visit.`} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Chips items={ADOPT_FILTERS} value={filter} onChange={setFilter} />
        <button type="button" aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)} className="cursor-pointer self-start text-[13px] font-semibold text-muted-foreground aria-pressed:text-pink-ink">
          {favOnly ? "♥ Saved only" : "♡ Show saved"}
        </button>
      </div>
      <SearchBox value={text} onChange={setText} placeholder="Search by name or trait — friendly, calm…" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {list.map((a) => (
          <AdoptCard key={a.id} a={a} fav={s.favourites.includes(a.id)} />
        ))}
        {!list.length && <Empty>No pets match. Try another filter.</Empty>}
      </div>
    </div>
  )
}

export function toggleFav(id: string) {
  update((s) => {
    s.favourites = s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [...s.favourites, id]
  })
}

function AdoptCard({ a, fav }: { a: AdoptPet; fav: boolean }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-card bg-frost shadow-soft transition-shadow hover:shadow-lift md:bg-white">
      <Link href={`/adoption/${a.id}`} className="flex flex-1 flex-col">
        <div className="grid aspect-[4/3] place-items-center bg-sage text-5xl">{a.emoji}</div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <Badge variant={a.sp === "dog" ? "found" : "lost"} className="text-[11px]">{a.sp}</Badge>
          <b className="text-sm font-extrabold">{a.name} · {a.title}</b>
          <span className="text-xs leading-4 text-muted-foreground">{a.meta}</span>
        </div>
      </Link>
      <button type="button" aria-label={fav ? `Remove ${a.name} from saved` : `Save ${a.name}`} aria-pressed={fav} onClick={() => toggleFav(a.id)} className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full bg-white/90 text-pink-ink shadow-soft">
        {fav ? "♥" : "♡"}
      </button>
    </div>
  )
}

export function AdoptDetail({ a }: { a: AdoptPet }) {
  const s = useBuddy()
  const fav = s.favourites.includes(a.id)
  const asked = s.requests.some((r) => r.kind === "visit" && r.title === a.name)
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-8">
      <div className="grid aspect-square place-items-center rounded-card bg-sage text-[120px] shadow-soft">{a.emoji}</div>
      <div className="flex flex-col gap-3">
        <Badge variant={a.sp === "dog" ? "found" : "lost"} className="text-xs">{a.sp}{a.young ? " · young" : ""}</Badge>
        <h1 className="text-h1">{a.name}</h1>
        <p className="text-sm font-bold">{a.title}</p>
        <p className="text-sm text-muted-foreground">{a.meta}</p>
        <p className="text-[15px] leading-[21px]">{a.about}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            disabled={asked}
            onClick={() => {
              update((st) => void st.requests.push({ id: uid(), kind: "visit", title: a.name, at: Date.now() }))
              toast(`Visit request sent for ${a.name} — the shelter will reply in My pets`)
            }}
          >
            {asked ? "✓ Visit requested" : "Request a visit"}
          </Button>
          <Button variant="outline" onClick={() => toggleFav(a.id)}>{fav ? "♥ Saved" : "♡ Save"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Demo listing. Requests are saved on this device only.</p>
      </div>
    </div>
  )
}

/* ---------- 06 · Services & Care ---------- */
export function ServiceList() {
  const s = useBuddy()
  const initial = firstMatch(SVC_TOPICS, s.query || "") || "Vet visit"
  const [picked, setTopic] = useState<string | null>(null)
  const topic = picked ?? initial
  const sp = speciesOf(s.query)
  const list = SERVICES.filter((x) => x.topic === topic)
  return (
    <div className="flex flex-col gap-4">
      <YouAsked answer={`Here are ${topic.toLowerCase()} options near you${sp ? ` for your ${sp}` : ""}. ${serviceTip(topic)}`} />
      <Chips items={SERVICE_TOPICS} value={topic} onChange={setTopic} />
      {!s.query && <p className="text-[13px] leading-[18px] text-muted-foreground">{serviceTip(topic)}</p>}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {list.map((x) => (
          <ServiceRow key={x.id} x={x} />
        ))}
      </div>
    </div>
  )
}

function ServiceRow({ x }: { x: Service }) {
  return (
    <Link href={`/services/${x.id}`} className="flex items-center gap-3 rounded-card bg-frost p-3.5 shadow-soft transition-shadow hover:shadow-lift md:flex-col md:items-start md:bg-white md:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-topic-green text-xl">🩺</span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm font-extrabold">{x.title}</b>
        <span className="block text-xs text-muted-foreground">{x.meta}</span>
      </span>
      <span className="text-xs font-bold text-green-dark">★ {x.rating}</span>
    </Link>
  )
}

const SLOTS = ["Today 16:30", "Tomorrow 10:00", "Tomorrow 14:30", "Mon 09:15"]

export function ServiceDetail({ x }: { x: Service }) {
  const s = useBuddy()
  const [slot, setSlot] = useState<string | null>(null)
  const booked = s.requests.find((r) => r.kind === "booking" && r.title.startsWith(x.title))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold tracking-wide text-green-dark uppercase">{x.topic}</p>
      <h1 className="text-h1">{x.title}</h1>
      <p className="text-sm text-muted-foreground">{x.meta} · ★ {x.rating}</p>
      <p className="text-[15px] leading-[21px]">{x.about}</p>
      {booked ? (
        <AiNote title="✓  Request sent">{booked.title}. You’ll find it in My pets.</AiNote>
      ) : (
        <>
          <h2 className="mt-2 text-base font-extrabold">Pick a time</h2>
          <Chips items={SLOTS} value={slot} onChange={setSlot} />
          <Button
            className="self-start"
            disabled={!slot}
            onClick={() => {
              update((st) => void st.requests.push({ id: uid(), kind: "booking", title: `${x.title} · ${slot}`, at: Date.now() }))
              toast("Booking request sent")
            }}
          >
            Request booking
          </Button>
        </>
      )}
      <p className="text-xs text-muted-foreground">Demo listing — no payment is taken.</p>
    </div>
  )
}

/* ---------- 07 · Shop ---------- */
const euros = (p: string) => parseFloat(p.replace("€", ""))

export function ShopList() {
  const s = useBuddy()
  const initial = firstMatch(SHOP_CATS, s.query || "") || "Food"
  const [picked, setCat] = useState<string | null>(null)
  const cat = picked ?? initial
  const [text, setText] = useState("")
  const sp = speciesOf(s.query)
  const list = text ? PRODUCTS.filter((p) => `${p.title} ${p.cat} ${p.size}`.toLowerCase().includes(text.toLowerCase())) : PRODUCTS.filter((p) => p.cat === cat)
  return (
    <div className="flex flex-col gap-4">
      <YouAsked answer={`Showing ${cat.toLowerCase()}${sp ? ` for ${sp}s` : ""}. Add to cart and we’ll keep it for you.`} />
      <SearchBox value={text} onChange={setText} placeholder="Search the shop…" />
      {!text && <Chips items={SHOP_CATEGORIES} value={cat} onChange={setCat} size="sm" />}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {list.map((p) => (
          <ProductRow key={p.id} p={p} qty={s.cart[p.id] ?? 0} />
        ))}
        {!list.length && <Empty>Nothing found for “{text}”.</Empty>}
      </div>
    </div>
  )
}

export function setQty(id: string, q: number) {
  update((s) => {
    if (q <= 0) delete s.cart[id]
    else s.cart[id] = q
  })
}

function Qty({ id, qty }: { id: string; qty: number }) {
  return qty ? (
    <span className="flex items-center gap-1 rounded-full bg-tint p-0.5">
      <button type="button" aria-label="One less" onClick={() => setQty(id, qty - 1)} className="grid size-7 cursor-pointer place-items-center rounded-full bg-white font-bold">−</button>
      <b className="w-5 text-center text-sm">{qty}</b>
      <button type="button" aria-label="One more" onClick={() => setQty(id, qty + 1)} className="grid size-7 cursor-pointer place-items-center rounded-full bg-white font-bold">+</button>
    </span>
  ) : (
    <Button size="sm" variant="outline" onClick={() => { setQty(id, 1); toast("Added to cart") }}>
      Add
    </Button>
  )
}

function ProductRow({ p, qty }: { p: Product; qty: number }) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft md:bg-white">
      <Link href={`/shop/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-topic-lilac text-2xl">{p.emoji}</span>
        <span className="min-w-0">
          <b className="block truncate text-sm font-extrabold">{p.title}</b>
          <span className="block text-xs text-muted-foreground">{p.size} · {p.price}</span>
        </span>
      </Link>
      <Qty id={p.id} qty={qty} />
    </div>
  )
}

export function ProductDetail({ p }: { p: Product }) {
  const s = useBuddy()
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-8">
      <div className="grid aspect-square place-items-center rounded-card bg-topic-lilac text-[110px] shadow-soft">{p.emoji}</div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{p.cat}</p>
        <h1 className="text-h1">{p.title}</h1>
        <p className="text-sm text-muted-foreground">{p.size}</p>
        <p className="text-2xl font-extrabold">{p.price}</p>
        <div className="flex items-center gap-3">
          <Qty id={p.id} qty={s.cart[p.id] ?? 0} />
          <Link href="/shop/cart" className="text-sm font-semibold underline">View cart</Link>
        </div>
      </div>
    </div>
  )
}

export function CartSummary({ className, full }: { className?: string; full?: boolean }) {
  const s = useBuddy()
  const lines = Object.entries(s.cart)
    .map(([id, q]) => ({ p: PRODUCTS.find((x) => x.id === id)!, q }))
    .filter((l) => l.p)
  const total = lines.reduce((a, l) => a + euros(l.p.price) * l.q, 0)
  if (!lines.length && !full) return null
  return (
    <section className={cn("rounded-card bg-white p-4 shadow-soft md:p-5", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold">Cart</h2>
        {!full && <Link href="/shop/cart" className="text-[13px] font-semibold underline">Open</Link>}
      </div>
      {lines.length ? (
        <>
          <ul className="mt-2 flex flex-col gap-2">
            {lines.map(({ p, q }) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{p.emoji} {p.title}</span>
                {full ? <Qty id={p.id} qty={q} /> : <span className="shrink-0 text-muted-foreground">× {q}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-line pt-3 font-extrabold">
            <span>Total</span>
            <span>€{total.toFixed(2)}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Checkout isn’t part of this demo — your cart is saved on this device.</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Your cart is empty.</p>
      )}
    </section>
  )
}
