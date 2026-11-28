import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { AREAS } from "@/lib/lost-pets/db"
import { STATUS_LABEL, getReport, reportDate, reportTitle, whenText } from "@/lib/lost-pets/query"
import { BackLink } from "@/components/buddy/page-title"
import { StatusBadge } from "@/components/buddy/pet-reports"
import { Screen } from "@/components/buddy/screen"
import { buttonVariants } from "@/components/ui/button"

export async function generateMetadata({ params }: PageProps<"/lost-found/reports/[id]">): Promise<Metadata> {
  const { id } = await params
  const r = getReport(id)
  return { title: r ? reportTitle(r) : "Report" }
}

/* One lost & found report — where AI answers link to. */
export default async function ReportPage({ params }: PageProps<"/lost-found/reports/[id]">) {
  await connection() // dates are relative to today
  const { id } = await params
  const r = getReport(id)
  if (!r) notFound()
  const rows: [string, string | null][] = [
    ["Animal", [r.species, r.breed].filter(Boolean).join(" · ")],
    ["Name", r.name],
    ["Colour", r.coat],
    ["Size", r.size],
    ["Sex / age", [r.sex, r.age].filter(Boolean).join(" · ") || null],
    ["Marks", r.marks],
    ["Collar", r.collar],
    ["Microchip", r.chip],
    ["Where", `${r.place}, ${AREAS[r.area].name}, ${AREAS[r.area].city}`],
    ["When", `${whenText(r)} · ${reportDate(r).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`],
    ["Now", r.now],
  ]
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/lost-found/reports">All reports</BackLink>
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2">
            <StatusBadge status={r.status} />
            <span className="text-xs text-muted-foreground">{r.id}</span>
          </span>
          <h1 className="text-h1">{reportTitle(r).replace(/^\w+: /, "")}</h1>
          <p className="text-sm leading-[19px] text-muted-foreground">{r.description}</p>
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 rounded-card bg-frost p-4 text-sm shadow-soft">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-bold">{k}</dt>
                <dd className="text-navy">{v}</dd>
              </div>
            ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          {STATUS_LABEL[r.status]} report · demo data. Contact goes through buddy; no personal details are published.
        </p>
        {r.status === "found" || r.status === "sighted" ? (
          <Link href="/lost-found/lost/report" className={buttonVariants()}>
            Is this your pet? Report it as lost
          </Link>
        ) : r.status === "lost" ? (
          <Link href="/lost-found/found" className={buttonVariants()}>
            I’ve seen this pet
          </Link>
        ) : null}
      </div>
    </Screen>
  )
}
