import type { Metadata } from "next"

import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { AdoptionList } from "@/components/buddy/sections"

export const metadata: Metadata = { title: "Adoption" }

/* 05 · Adoption (Figma 461:957) */
export default function AdoptionPage() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/">Home</BackLink>
        <PageTitle title="Adoption">Find a new friend from shelters near you.</PageTitle>
        <AdoptionList />
      </div>
    </Screen>
  )
}
