import Link from "next/link"

import { cn } from "@/lib/utils"
import { AREAS, type PetReport, type Status } from "@/lib/lost-pets/db"
import { STATUS_LABEL, reportPath, whenText } from "@/lib/lost-pets/query"
import { Badge } from "@/components/ui/badge"

/* The lost & found reports database on the site (the same data the AI connector reads). */

const EMOJI: Record<PetReport["species"], string> = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐇", other: "🐾" }
const BADGE: Record<Status, "lost" | "found" | "other" | "outline"> = { lost: "lost", found: "found", sighted: "outline", reunited: "other" }

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={BADGE[status]} className="text-xs">
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export function ReportCard({ r }: { r: PetReport }) {
  return (
    <Link href={reportPath(r)} className="flex items-start gap-3 rounded-card bg-frost p-3.5 shadow-soft transition-shadow hover:shadow-[0_10px_26px_rgb(16_40_139/0.12)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-tint text-2xl" aria-hidden>
        {EMOJI[r.species]}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={r.status} />
          <span className="text-xs text-muted-foreground">
            {r.id} · {whenText(r)}
          </span>
        </span>
        <b className="text-[15px] leading-5">
          {[r.size, r.coat, r.breed ?? r.species].join(" · ")}
          {r.name ? ` · “${r.name}”` : ""}
        </b>
        <span className="text-[13px] leading-[18px] text-muted-foreground">
          {r.place}, {AREAS[r.area].name} · {r.description}
        </span>
      </span>
    </Link>
  )
}

export const FILTERS: { key: Status | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "found", label: "Found" },
  { key: "sighted", label: "Sighted" },
  { key: "lost", label: "Lost" },
  { key: "reunited", label: "Reunited" },
]

export function ReportFilters({ active }: { active: Status | null }) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Filter reports">
      {FILTERS.map((f) => (
        <Link
          key={f.label}
          href={f.key ? `/lost-found/reports?status=${f.key}` : "/lost-found/reports"}
          aria-current={active === f.key ? "page" : undefined}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
            active === f.key ? "bg-navy text-white" : "bg-tint text-navy hover:brightness-95"
          )}
        >
          {f.label}
        </Link>
      ))}
    </nav>
  )
}
