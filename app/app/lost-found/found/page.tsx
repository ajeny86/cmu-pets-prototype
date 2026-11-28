import type { Metadata } from "next"

import { FoundPhoto } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "I found a pet" }

/* 20 · Submit picture (Figma 461:4258) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <FoundPhoto />
      </div>
    </Screen>
  )
}
