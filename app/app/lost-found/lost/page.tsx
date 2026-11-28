import type { Metadata } from "next"

import { MemberChoice } from "@/components/buddy/lost-flow"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Already a member?" }

/* 10 · Already a member? (Figma 461:1443) */
export default function Page() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <MemberChoice />
      </div>
    </Screen>
  )
}
