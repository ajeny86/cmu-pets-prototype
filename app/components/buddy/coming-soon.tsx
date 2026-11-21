import Link from "next/link"

import { Clue, type ClueState } from "@/components/buddy/clue"
import { BackLink, PageTitle } from "@/components/buddy/page-title"
import { Screen } from "@/components/buddy/screen"
import { buttonVariants } from "@/components/ui/button"

/** Placeholder for a screen that exists in Figma but is not built in the app yet. */
export function ComingSoon({
  title,
  lede,
  heading = "Coming soon",
  clue = "empty",
  back = { href: "/", label: "Home" },
  note = "This screen is designed in Figma and coming to the app soon.",
}: {
  title: string
  lede?: string
  heading?: string
  /** Clue's pose: "empty" for screens not built yet, "not-found" on the 404 page. */
  clue?: ClueState
  back?: { href: string; label: string }
  note?: string
}) {
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4 pt-2">
        <BackLink href={back.href}>{back.label}</BackLink>
        <PageTitle title={title}>{lede}</PageTitle>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-card bg-frost px-6 py-8 text-center shadow-soft">
          <Clue state={clue} width={140} />
          <div>
            <p className="text-section">{heading}</p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{note}</p>
          </div>
          <Link href={back.href} className={buttonVariants({ variant: "outline" })}>
            Back to {back.label}
          </Link>
        </div>
      </div>
    </Screen>
  )
}
