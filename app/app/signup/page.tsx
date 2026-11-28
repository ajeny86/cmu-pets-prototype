import type { Metadata } from "next"

import { SignUp } from "@/components/buddy/account"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Create account" }

export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <SignUp />
      </div>
    </Screen>
  )
}
