"use client"

import Link from "next/link"

import { field, petLabel } from "@/lib/ai/story"
import { update, useBuddy } from "@/lib/store"
import { PetPhoto, SectionTitle, speciesEmoji } from "@/components/buddy/kit"

const STATUS: Record<string, string> = {
  searching: "Searching",
  match: "Possible match",
  "no-match": "Live · no match yet",
  reunited: "Reunited ✓",
}

/** "Your reports" on Home: the lost and found reports saved on this device. */
export function RecentActivity() {
  const s = useBuddy()
  const items = [
    ...s.reports.map((r) => ({
      id: r.id,
      at: r.createdAt,
      href: r.status === "match" ? "/lost-found/lost/match" : r.status === "reunited" ? "/lost-found/lost/reunite" : "/lost-found/lost/no-match",
      title: `Lost · ${petLabel(r.draft)}`,
      meta: [STATUS[r.status], field(r.draft, "city").v].filter(Boolean).join(" · "),
      photo: r.draft.lostPhoto,
      emoji: speciesEmoji(r.draft.species),
      pick: () =>
        update((st) => {
          st.currentReport = r.id
          st.draft = r.draft
        }),
    })),
    ...s.foundReports.map((r) => ({
      id: r.id,
      at: r.createdAt,
      href: "/lost-found/found/share",
      title: `Found · ${r.animal || "animal"}`,
      meta: [r.now === "seen" ? "Sighting" : "In someone’s care", r.spot].filter(Boolean).join(" · "),
      photo: r.photo,
      emoji: speciesEmoji(r.reading?.kind),
      pick: () =>
        update((st) => {
          st.currentFound = r.id
        }),
    })),
  ].sort((a, b) => b.at - a.at)
  if (!items.length) return null
  return (
    <section className="mt-8">
      <SectionTitle action={<Link href="/pets" className="text-[13px] font-semibold text-muted-foreground hover:underline">See all →</Link>}>
        Your reports
      </SectionTitle>
      <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {items.slice(0, 3).map((i) => (
          <Link key={i.id} href={i.href} onClick={i.pick} className="flex items-center gap-3 rounded-card bg-frost p-3 shadow-soft hover:shadow-lift md:bg-white">
            <PetPhoto src={i.photo} emoji={i.emoji} size={52} />
            <span className="min-w-0">
              <b className="block truncate text-sm font-extrabold">{i.title}</b>
              <span className="block truncate text-xs text-muted-foreground">{i.meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
