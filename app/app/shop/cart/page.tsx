import type { Metadata } from "next"

import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { CartSummary } from "@/components/buddy/sections"

export const metadata: Metadata = { title: "Cart" }

export default function CartPage() {
  return (
    <Screen>
      <div className="flex flex-col gap-4 pt-2">
        <BackLink href="/shop">Shop</BackLink>
        <PageTitle title="Your cart" />
        <CartSummary full />
      </div>
    </Screen>
  )
}
