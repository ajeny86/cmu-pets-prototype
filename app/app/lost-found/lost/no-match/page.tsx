import type { Metadata } from "next"

import { NoMatch } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "No match yet" }

/* 18 · No match yet (Figma 463:461) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <NoMatch />
      </div>
    </Screen>
  )
}
