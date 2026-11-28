import type { Metadata } from "next"

import { Searching } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Searching" }

/* 15 · Report submitted · searching (Figma 461:3109) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <Searching />
      </div>
    </Screen>
  )
}
