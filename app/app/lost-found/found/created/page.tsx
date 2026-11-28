import type { Metadata } from "next"

import { FoundCreated } from "@/components/buddy/found-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Report created" }

/* 23 · Report created · help more? (Figma 461:4587) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <FoundCreated />
      </div>
    </Screen>
  )
}
