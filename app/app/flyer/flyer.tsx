"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { cap, field, petLabel } from "@/lib/ai/story"
import { currentFound, currentReport, useBuddy } from "@/lib/store"
import { PetPhoto, speciesEmoji } from "@/components/buddy/kit"
import { Button } from "@/components/ui/button"

export function Flyer() {
  const found = useSearchParams().get("type") === "found"
  const s = useBuddy()
  const router = useRouter()
  const r = currentReport(s)
  const f = currentFound(s)
  const d = r?.draft ?? s.draft
  const sp = found ? (f?.reading?.kind || f?.animal.split(/[\s·]/)[0] || "pet").toLowerCase() : (d.species || "pet").toLowerCase()
  const photo = found ? f?.photo : d.lostPhoto
  const lines = found
    ? [f?.animal, f?.collar && `Collar: ${f.collar}`, f?.notes, f?.spot && `Found near ${f.spot}`, f?.time].filter(Boolean)
    : [field(d, "traits").v || d.photoLook, field(d, "chip").v, `Last seen ${[field(d, "lost").v, field(d, "city").v].filter(Boolean).join(", ") || "nearby"}`, field(d, "time").v].filter(Boolean)
  const phone = found ? null : field(d, "contact").v
  return (
    <div className="min-h-svh bg-[#eef1f9] p-4 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-[560px] flex-col gap-4">
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => router.back()}>
            ‹ Back
          </Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
        <article className="flex flex-col items-center gap-4 rounded-[24px] bg-white p-8 text-center shadow-lift print:shadow-none">
          <h1 className={found ? "text-[54px] leading-none font-black tracking-[-2px] text-navy" : "text-[54px] leading-none font-black tracking-[-2px] text-magenta"}>
            {found ? "FOUND" : "LOST"} {sp.toUpperCase()}
          </h1>
          {!found && <p className="text-3xl font-extrabold">{cap(petLabel(d))}</p>}
          <PetPhoto src={photo} emoji={speciesEmoji(sp)} size={300} className="rounded-[20px]" />
          <ul className="flex flex-col gap-1 text-lg leading-6">
            {lines.map((l) => (
              <li key={String(l)}>{l}</li>
            ))}
          </ul>
          {phone ? (
            <p className="rounded-full bg-navy px-6 py-3 text-2xl font-extrabold text-white">Call {phone}</p>
          ) : (
            <p className="text-base font-semibold text-muted-foreground">{found ? `Is it yours? Open buddy.app/f/${f?.code ?? "demo"}` : "Seen this pet? Report a sighting on buddy."}</p>
          )}
          <p className="text-xs text-muted-foreground">Made with buddy · demo</p>
        </article>
      </div>
    </div>
  )
}
