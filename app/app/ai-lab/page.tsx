import type { Metadata } from "next"

import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { AiLab } from "./ai-lab"

export const metadata: Metadata = { title: "AI lab" }

/* Test the on-device AI: photo recognition, story parsing, intent routing and matching. */
export default function AiLabPage() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/settings">Settings</BackLink>
        <PageTitle title="✧ AI lab">
          Everything here runs in this browser — nothing is sent to a server. The photo model downloads once, then works offline.
        </PageTitle>
        <AiLab />
      </div>
    </Screen>
  )
}
