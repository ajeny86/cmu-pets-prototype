import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SERVICES } from "@/lib/demo-data"
import { BackLink } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { ServiceDetail } from "@/components/buddy/sections"

export const dynamicParams = false
export const generateStaticParams = () => SERVICES.map((x) => ({ id: x.id }))

export async function generateMetadata({ params }: PageProps<"/services/[id]">): Promise<Metadata> {
  const { id } = await params
  const x = SERVICES.find((s) => s.id === id)
  return { title: x ? x.title : "Services & Care" }
}

export default async function ServicePage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params
  const x = SERVICES.find((s) => s.id === id)
  if (!x) notFound()
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/services">Services & Care</BackLink>
        <ServiceDetail x={x} />
      </div>
    </Screen>
  )
}
