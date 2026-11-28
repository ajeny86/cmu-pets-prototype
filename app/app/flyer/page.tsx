import type { Metadata } from "next"
import { Suspense } from "react"

import { Flyer } from "./flyer"

export const metadata: Metadata = { title: "Poster" }

/* Printable LOST / FOUND poster built from the report (prototype `openFlyer`). ?type=found|lost */
export default function FlyerPage() {
  return (
    <Suspense>
      <Flyer />
    </Suspense>
  )
}
