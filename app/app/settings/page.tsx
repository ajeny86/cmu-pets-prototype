import type { Metadata } from "next"

import { SettingsPage } from "@/components/buddy/account"
import { Screen } from "@/components/buddy/screen"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return (
    <Screen width="narrow">
      <div className="flex flex-col gap-4 pt-2">
        <SettingsPage />
      </div>
    </Screen>
  )
}
