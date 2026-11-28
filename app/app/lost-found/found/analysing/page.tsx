import type { Metadata } from "next"

import { FoundAnalyse } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Creating the report" }

/* 21 · AI analyses picture (Figma 461:4354) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <FoundAnalyse />
      </div>
    </Screen>
  )
}
