import type { Metadata } from "next"

import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { CartSummary, ShopList } from "@/components/buddy/sections"

export const metadata: Metadata = { title: "Shop" }

/* 07 · Shop (Figma 461:1297) */
export default function ShopPage() {
  return (
    <Screen width="wide">
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/">Home</BackLink>
        <PageTitle title="Shop">Everyday pet essentials.</PageTitle>
        <ShopList />
        <CartSummary className="md:max-w-[420px] md:self-end" />
      </div>
    </Screen>
  )
}
