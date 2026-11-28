import type { Metadata } from "next"

import { MyPets } from "@/components/buddy/account"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "My pets" }

export default function Page() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <MyPets />
      </div>
    </Screen>
  )
}
