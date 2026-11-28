import type { Metadata } from "next"

import { FoundThanks } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Thank you" }

/* 25 · Good job, thank you (Figma 461:4861) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <FoundThanks />
      </div>
    </Screen>
  )
}
