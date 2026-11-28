import type { Metadata } from "next"

import { Reunite } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Reunite" }

/* 17 · Match → reunite (Figma 461:3329) */
export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <Reunite />
      </div>
    </Screen>
  )
}
