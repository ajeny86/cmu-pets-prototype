"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { useToast } from "@/lib/toast"
import { useDictation } from "@/lib/ai/speech"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon } from "@/components/buddy/icons"

/** Bottom toast (prototype `#toast`). Mounted once in the root layout. */
export function Toaster() {
  const t = useToast()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[110px] z-[1000] flex justify-center px-6 md:bottom-8">
      {t && (
        <p
          key={t.id}
          className="max-w-[360px] animate-in rounded-full bg-navy px-4 py-2.5 text-center text-[13px] leading-[18px] font-semibold text-white shadow-lift fade-in slide-in-from-bottom-2"
        >
          {t.text}
        </p>
      )}
    </div>
  )
}

/** "✧ AI Guide" note: Clue's words in a pink-edged box. */
export function AiNote({ title = "✧  AI Guide", children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[18px] bg-white/80 p-3.5 shadow-[0_3px_10px_rgb(16_40_139/0.06),inset_0_0_0_1.5px_var(--pink)]", className)}>
      <b className="text-xs font-extrabold tracking-wide text-pink-ink">{title}</b>
      <div className="mt-1 text-[13.5px] leading-[19px] text-navy">{children}</div>
    </div>
  )
}

/** Pill chips: one active (filters, quick choices). */
export function Chips<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "md",
}: {
  items: readonly T[]
  value: T | null
  onChange: (v: T) => void
  className?: string
  size?: "sm" | "md"
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group">
      {items.map((i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i === value}
          onClick={() => onChange(i)}
          className={cn(
            "cursor-pointer rounded-full bg-white font-semibold text-navy shadow-[0_3px_10px_rgb(16_40_139/0.07)] transition-colors hover:bg-tint aria-pressed:bg-navy aria-pressed:text-white",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-[13px]"
          )}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

/** Clue working through steps one by one (prototype `runStatus`). Calls onDone when the last step ticks. */
export function StatusSteps({
  title,
  steps,
  speed = 650,
  onDone,
  className,
}: {
  title: string
  steps: string[]
  speed?: number
  onDone?: () => void
  className?: string
}) {
  const [done, setDone] = useState(0)
  const cb = useRef(onDone)
  useEffect(() => {
    cb.current = onDone
  })
  const key = steps.join("|")
  useEffect(() => {
    const n = key.split("|").length
    const timers = Array.from({ length: n }, (_, i) => setTimeout(() => setDone(i + 1), speed * (i + 1)))
    timers.push(setTimeout(() => cb.current?.(), speed * n + 350))
    return () => {
      timers.forEach(clearTimeout)
      setDone(0)
    }
  }, [key, speed])
  const finished = done >= steps.length
  return (
    <div className={cn("rounded-[20px] bg-white/85 p-4 shadow-soft", className)} role="status">
      <div className="flex items-center gap-2 text-sm font-extrabold text-navy">
        <Image src="/assets/sparkle.svg" alt="" width={18} height={18} className={cn(!finished && "animate-spin [animation-duration:2.4s]")} />
        {title}
      </div>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <li
            key={s}
            className={cn("flex items-center gap-2 text-[13px] leading-[18px] transition-colors", i < done ? "text-navy" : "text-periwinkle")}
          >
            <span
              className={cn(
                "grid size-[18px] shrink-0 place-items-center rounded-full text-[10px] font-bold",
                i < done ? "bg-green text-white" : "bg-tint text-transparent"
              )}
            >
              ✓
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Navy / light card that links somewhere, with a small tag (e.g. "Where to?" choices). */
export function LinkCard({
  href,
  onClick,
  tag,
  title,
  description,
  dark,
  className,
}: {
  href?: string
  onClick?: () => void
  tag?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  dark?: boolean
  className?: string
}) {
  const cls = cn(
    "flex w-full cursor-pointer flex-col gap-1.5 rounded-card p-4 text-left transition-shadow",
    dark ? "bg-navy text-white shadow-[0_10px_24px_rgb(16_40_139/0.25)]" : "bg-frost text-navy shadow-soft hover:shadow-[0_10px_26px_rgb(16_40_139/0.12)] md:bg-white",
    className
  )
  const body = (
    <>
      <span className="flex items-center justify-between">
        {tag ?? <span />}
        <svg viewBox="0 0 24 24" width={dark ? 20 : 18} height={dark ? 20 : 18} aria-hidden="true" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke={dark ? "#ffffff" : "var(--periwinkle)"}>
          <path d={dark ? "M5 12h14M13 6l6 6-6 6" : "M7 17 17 7M8 7h9v9"} />
        </svg>
      </span>
      <b className="text-[17px] font-extrabold tracking-[-0.3px]">{title}</b>
      {description && <span className={cn("text-xs leading-4", dark ? "text-[#c3cbea]" : "text-muted-foreground")}>{description}</span>}
    </>
  )
  return href ? (
    <Link href={href} onClick={onClick} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  )
}

/** Mic button wired to the Web Speech API. */
export function MicButton({
  onText,
  onDone,
  className,
}: {
  onText?: (t: string) => void
  onDone?: (t: string) => void
  className?: string
}) {
  const { listening, busy, toggle } = useDictation({ onText, onDone })
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={busy ? "Turning your voice into text…" : listening ? "Stop listening" : "Speak"}
      title={busy ? "Turning your voice into text…" : listening ? "Listening — tap to stop" : "Speak"}
      aria-pressed={listening}
      aria-busy={busy}
      onClick={toggle}
      className={cn(
        "shrink-0 hover:bg-mint aria-pressed:animate-pulse aria-pressed:bg-topic-pink aria-busy:animate-spin aria-busy:bg-mint",
        className
      )}
    >
      <Image src="/assets/mic.svg" alt="" width={22} height={22} />
    </Button>
  )
}

/** One-line input with mic and send (Clue's dock, chat). */
export function AskBar({
  placeholder = "Type or say it…",
  onSend,
  sendLabel,
  autoFocus,
  className,
}: {
  placeholder?: string
  onSend: (text: string) => void
  sendLabel?: string
  autoFocus?: boolean
  className?: string
}) {
  const [v, setV] = useState("")
  const send = (t = v) => {
    if (!t.trim()) return
    onSend(t.trim())
    setV("")
  }
  return (
    <form
      className={cn("flex items-center gap-1.5 rounded-[28px] bg-white py-1.5 pr-1.5 pl-4 shadow-lift focus-within:shadow-[0_10px_28px_rgb(16_40_139/0.16),inset_0_0_0_1.5px_#c9d1ee]", className)}
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-navy outline-none placeholder:text-[#767fa3]"
      />
      <MicButton onText={setV} onDone={send} />
      {sendLabel ? (
        <Button type="submit" className="h-10 shrink-0 px-4">
          {sendLabel}
        </Button>
      ) : (
        <Button type="submit" size="icon-sm" aria-label="Send" className="size-10">
          <ArrowRightIcon />
        </Button>
      )}
    </form>
  )
}

/** Square pet photo, or an emoji on sage when there's no photo. */
export function PetPhoto({ src, emoji = "🐾", size = 88, className }: { src?: string | null; emoji?: string; size?: number; className?: string }) {
  return (
    <div
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-[14px] bg-sage leading-none", className)}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data: URLs from the camera
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        emoji
      )}
    </div>
  )
}

export const speciesEmoji = (sp?: string | null) =>
  ({ cat: "🐈", dog: "🐕", bird: "🦜", rabbit: "🐇", hamster: "🐹", lizard: "🦎", turtle: "🐢", fish: "🐟", horse: "🐎" })[
    (sp || "").toLowerCase()
  ] ?? "🐾"

/** Photo picker: camera on phones, file chooser on desktop. */
export function PhotoPicker({
  onFile,
  label = "Take / upload photo",
  variant = "default",
  className,
}: {
  onFile: (f: File) => void
  label?: string
  variant?: "default" | "outline"
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={() => ref.current?.click()}>
        📷 {label}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ""
        }}
      />
    </>
  )
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-section">{children}</h2>
      {action}
    </div>
  )
}
