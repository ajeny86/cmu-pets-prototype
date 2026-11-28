import type { Metadata } from "next"

import { LocationStep } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Where was your pet last seen?" }

/* 14 · Location clarification (Figma 461:2933) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <LocationStep />
      </div>
    </Screen>
  )
}
