import type { Metadata } from "next"

import { FoundCheck } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Check the found report" }

/* 22 · Check the found report (Figma 461:4444) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <FoundCheck />
      </div>
    </Screen>
  )
}
