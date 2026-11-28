import type { Metadata } from "next"

import { FoundShare } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Share" }

/* 24 · Share + saved nearby (Figma 461:4704) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <FoundShare />
      </div>
    </Screen>
  )
}
