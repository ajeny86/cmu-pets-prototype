import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PRODUCTS } from "@/lib/demo-data"
import { BackLink } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { ProductDetail } from "@/components/buddy/sections"

export const dynamicParams = false
export const generateStaticParams = () => PRODUCTS.map((p) => ({ id: p.id }))

export async function generateMetadata({ params }: PageProps<"/shop/[id]">): Promise<Metadata> {
  const { id } = await params
  const p = PRODUCTS.find((x) => x.id === id)
  return { title: p ? p.title : "Shop" }
}

export default async function ProductPage({ params }: PageProps<"/shop/[id]">) {
  const { id } = await params
  const p = PRODUCTS.find((x) => x.id === id)
  if (!p) notFound()
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/shop">Shop</BackLink>
        <ProductDetail p={p} />
      </div>
    </Screen>
  )
}
