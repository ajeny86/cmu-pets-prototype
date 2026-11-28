import type { Metadata } from "next"

import { SeenMap } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Last seen here" }

/* 18b · Last seen here · search area + vets (Figma 461:3912) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <SeenMap />
      </div>
    </Screen>
  )
}
