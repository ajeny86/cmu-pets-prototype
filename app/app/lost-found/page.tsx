import type { Metadata } from "next"

import { ChoiceCard } from "@/components/buddy/cards"
import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "Lost & Found · buddy" }

/* 03 · Lost & Found · choose (Figma 461:740) */
export default function LostFoundPage() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/">Home</BackLink>
        <PageTitle title="Lost & Found">Tell us what happened. We’ll guide you step by step.</PageTitle>
        <div className="flex flex-col gap-3">
          <ChoiceCard
            dark
            href="/lost-found/lost"
            tag={<Badge variant="lost" className="text-xs">lost pet</Badge>}
            title="I lost my pet"
            description="Create a lost report and let AI look for matches."
          />
          <ChoiceCard
            href="/lost-found/found"
            tag={<Badge variant="found" className="text-xs">found pet</Badge>}
            title="I found a pet"
            description="Snap a photo — AI fills in the report for you."
          />
          <ChoiceCard
            href="/chat"
            tag={<Badge variant="other" className="text-xs">ask AI</Badge>}
            title="Something else"
            description="Ask the AI Guide anything."
          />
        </div>
      </div>
    </Screen>
  )
}
