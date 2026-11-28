import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ADOPTION } from "@/lib/demo-data"
import { BackLink } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { AdoptDetail } from "@/components/buddy/sections"

export const dynamicParams = false
export const generateStaticParams = () => ADOPTION.map((a) => ({ id: a.id }))

export async function generateMetadata({ params }: PageProps<"/adoption/[id]">): Promise<Metadata> {
  const { id } = await params
  const a = ADOPTION.find((x) => x.id === id)
  return { title: a ? `${a.name} · Adoption` : "Adoption" }
}

export default async function AdoptPetPage({ params }: PageProps<"/adoption/[id]">) {
  const { id } = await params
  const a = ADOPTION.find((x) => x.id === id)
  if (!a) notFound()
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/adoption">Adoption</BackLink>
        <AdoptDetail a={a} />
      </div>
    </Screen>
  )
}
