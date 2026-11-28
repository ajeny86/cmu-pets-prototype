"use client"

import { useRouter } from "next/navigation"

import { startLostReport } from "@/lib/guide"
import { update, useBuddy } from "@/lib/store"
import { Clue } from "@/components/buddy/clue"
import { AiNote, LinkCard } from "@/components/buddy/kit"
import { Badge } from "@/components/ui/badge"

const ROUTES = [
  { to: "lost", tag: <Badge variant="lost" className="text-xs">lost pet</Badge>, title: "I lost a pet", dark: true },
  { to: "found", tag: <Badge variant="found" className="text-xs">found pet</Badge>, title: "I found a pet" },
  { to: "adoption", tag: <span className="text-xs font-bold text-periwinkle-2">01</span>, title: "Adoption" },
  { to: "services", tag: <span className="text-xs font-bold text-periwinkle-2">03</span>, title: "Services & Care" },
  { to: "shop", tag: <span className="text-xs font-bold text-periwinkle-2">04</span>, title: "Shop" },
] as const

export function WhereTo() {
  const s = useBuddy()
  const router = useRouter()
  const go = (to: (typeof ROUTES)[number]["to"]) => {
    const msg = s.pending
    if (to === "lost") {
      startLostReport(msg || "")
      return router.push(s.profile ? "/lost-found/lost/report" : "/lost-found/lost")
    }
    update((st) => {
      st.pending = null
      if (to !== "found") st.query = msg
    })
    router.push(to === "found" ? "/lost-found/found" : `/${to}`)
  }
  return (
    <>
      <div className="flex items-end gap-2">
        <Clue state="no-results" width={96} />
        <AiNote className="flex-1">
          {s.pending && <p className="mb-1 text-muted-foreground italic">“{s.pending}”</p>}
          I’m not sure what you need. Where should I take you?
        </AiNote>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ROUTES.map((r) => (
          <LinkCard key={r.to} tag={r.tag} title={r.title} dark={"dark" in r} onClick={() => go(r.to)} className={r.to === "lost" ? "md:col-span-2" : undefined} />
        ))}
      </div>
    </>
  )
}
