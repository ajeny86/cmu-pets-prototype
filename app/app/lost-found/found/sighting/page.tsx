import type { Metadata } from "next"

import { SightingRoute } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Which way did it go?" }

/* 26 · I only saw it → which way did it go? (Figma 461:4942) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <SightingRoute />
      </div>
    </Screen>
  )
}
