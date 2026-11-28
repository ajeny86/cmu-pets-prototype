import type { Metadata } from "next"

import { MatchStep } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Is this your pet?" }

/* 16 · Is this Luna? (match) (Figma 461:3204) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <MatchStep />
      </div>
    </Screen>
  )
}
