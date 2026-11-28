import type { Metadata } from "next"
import { connection } from "next/server"

import { listReports } from "@/lib/lost-pets/query"
import type { Status } from "@/lib/lost-pets/db"
import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { ReportCard, ReportFilters } from "@/components/buddy/pet-reports"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Lost & found reports" }

/* The lost & found reports database (demo). The same data the AI connector (/api/mcp) searches. */
export default async function ReportsPage({ searchParams }: PageProps<"/lost-found/reports">) {
  await connection() // dates are relative to today
  const sp = await searchParams
  const status = (["found", "sighted", "lost", "reunited"] as const).find((s) => s === sp.status) ?? null
  const reports = listReports(status as Status | null)
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/lost-found">Lost & Found</BackLink>
        <PageTitle title="Lost & found reports">
          Animals people found, saw or lost, newest first. Demo data — contact goes through buddy. AI assistants can search these too.
        </PageTitle>
        <ReportFilters active={status} />
        <p className="text-xs text-muted-foreground">{reports.length} reports</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {reports.map((r) => (
            <ReportCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </Screen>
  )
}
