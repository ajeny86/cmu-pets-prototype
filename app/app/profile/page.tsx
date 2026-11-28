import type { Metadata } from "next"

import { ProfilePage } from "@/components/buddy/account"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Profile" }

export default function Page() {
  return (
    <Screen width="narrow">
      <div className="flex flex-col gap-4 pt-2">
        <ProfilePage />
      </div>
    </Screen>
  )
}
