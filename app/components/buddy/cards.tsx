import Link from "next/link"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type ChoiceCardProps = {
  title: React.ReactNode
  description?: React.ReactNode
  tag?: React.ReactNode
  dark?: boolean
  /** When set, the card is a link and shows the corner arrow (→ on navy, ↗ on light). */
  href?: string
  className?: string
}

/** Choice card (Figma: "Light or navy · r 22"), e.g. Lost & Found · "I lost my pet" / "I found a pet". */
export function ChoiceCard({ title, description, tag, dark = false, href, className }: ChoiceCardProps) {
  const classes = cn(
    "flex w-full cursor-pointer flex-col gap-1.5 rounded-card p-4 text-left transition-shadow",
    dark
      ? "bg-navy text-white shadow-[0_10px_24px_rgb(16_40_139/0.25)]"
      : "bg-frost text-navy shadow-soft hover:shadow-[0_10px_26px_rgb(16_40_139/0.12)]",
    className
  )
  const body = (
    <>
      {(tag || href) && (
        <span className="flex items-center justify-between">
          {tag ?? <span />}
          {href && (
            <svg viewBox="0 0 24 24" width={dark ? 20 : 18} height={dark ? 20 : 18} aria-hidden="true" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke={dark ? "#ffffff" : "var(--periwinkle)"}>
              <path d={dark ? "M5 12h14M13 6l6 6-6 6" : "M7 17 17 7M8 7h9v9"} />
            </svg>
          )}
        </span>
      )}
      <b className="text-[17px] font-extrabold tracking-[-0.3px]">{title}</b>
      {description && (
        <span className={cn("text-xs leading-4", dark ? "text-[#c3cbea]" : "text-muted-foreground")}>
          {description}
        </span>
      )}
    </>
  )
  return href ? (
    <Link href={href} data-dark={dark || undefined} className={classes}>
      {body}
    </Link>
  ) : (
    <button type="button" data-dark={dark || undefined} className={classes}>
      {body}
    </button>
  )
}

/** Match card (Figma: "Cream + teal % tag"). */
export function MatchCard({
  confidence,
  title,
  note,
  photo = "🐈",
  reasons,
  className,
}: {
  confidence: number
  title: React.ReactNode
  note?: React.ReactNode
  /** An emoji or an <img>; the sage square is the placeholder background. */
  photo?: React.ReactNode
  reasons: { ok: boolean; text: React.ReactNode }[]
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-card bg-cream p-3 shadow-soft ring-1 ring-card-line/60", className)}>
      <div className="flex gap-3">
        <div className="grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-[12px] bg-sage text-[46px] leading-none">
          {photo}
        </div>
        <div className="flex flex-col gap-1.5">
          <Badge variant="match">{confidence}% match confidence</Badge>
          <b className="text-sm font-extrabold">{title}</b>
          {note && <span className="text-xs leading-4 text-muted-foreground">{note}</span>}
        </div>
      </div>
      <ul className="flex flex-col gap-[3px] text-[11px] leading-[15px] text-muted-foreground">
        <li>
          <b className="font-semibold text-navy">Why this match</b>
        </li>
        {reasons.map((r, i) => (
          <li key={i}>
            {r.ok ? "✓" : "?"} {r.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
