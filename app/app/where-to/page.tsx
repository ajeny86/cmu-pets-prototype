import type { Metadata } from "next"

import { BackLink } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { WhereTo } from "./where-to"

export const metadata: Metadata = { title: "Where to?" }

/* 02 · Unclear message → where to? (Figma 461:609) */
export default function WhereToPage() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/">Home</BackLink>
        <WhereTo />
      </div>
    </Screen>
  )
}
