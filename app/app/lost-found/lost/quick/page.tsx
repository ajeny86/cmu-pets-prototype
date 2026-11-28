import type { Metadata } from "next"

import { QuickReport } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Report your pet as lost" }

/* 13 · Member · Lost button (Figma 464:824) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <QuickReport />
      </div>
    </Screen>
  )
}
