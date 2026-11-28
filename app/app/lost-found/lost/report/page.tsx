import type { Metadata } from "next"

import { LostReportForm } from "@/components/buddy/lost-report"
import { BackLink } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Report a lost pet" }

/* 11 · first open (Figma 461:1550) → 12 · all set (461:1863) · 12b · signed in (464:461) */
export default function ReportPage() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/lost-found">Lost & Found</BackLink>
        <h1 className="text-h1">Report a lost pet</h1>
        <LostReportForm />
      </div>
    </Screen>
  )
}
