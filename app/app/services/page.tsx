import type { Metadata } from "next"

import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { ServiceList } from "@/components/buddy/sections"

export const metadata: Metadata = { title: "Services & Care" }

/* 06 · Services & Care (Figma 461:1163) */
export default function ServicesPage() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/">Home</BackLink>
        <PageTitle title="Services & Care">Trusted care for your pet, nearby.</PageTitle>
        <ServiceList />
      </div>
    </Screen>
  )
}
