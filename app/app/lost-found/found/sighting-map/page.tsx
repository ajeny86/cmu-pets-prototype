import type { Metadata } from "next"

import { SightingMap } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Sighting saved" }

/* 27 · Sighting · search area + vets & shelters (Figma 461:5169) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <SightingMap />
      </div>
    </Screen>
  )
}
