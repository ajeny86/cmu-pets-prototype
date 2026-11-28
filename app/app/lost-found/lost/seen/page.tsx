import type { Metadata } from "next"

import { SeenMatch } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "New sighting" }

/* 18a · Seen, not caught (Figma 461:3725) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <SeenMatch />
      </div>
    </Screen>
  )
}
