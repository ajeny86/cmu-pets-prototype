"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Clue } from "@/components/buddy/clue"
import { ArrowRightIcon } from "@/components/buddy/icons"
import { MicButton } from "@/components/buddy/kit"
import { routeMessage } from "@/lib/guide"
import { toast } from "@/lib/toast"

/* AI components. Pink is reserved for Clue, the AI guide (Figma sheet: "a pink for AI"). */

/** Clue standing on the page with a speech bubble (Home). */
export function ClueGreeting({
  title = (
    <>
      Hi! I’m <em className="text-pink not-italic">Clue</em>
    </>
  ),
  children = "Adoption, care, lost & found, shop — just ask, I’ll take you there.",
  className,
}: {
  title?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Clue state="hello" width={128} priority className="-ml-2 drop-shadow-[0_10px_12px_rgb(91_75_196/0.18)]" />
      <div className="relative flex-1 rounded-[22px_22px_22px_8px] bg-frost px-3.5 pt-3 pb-[13px] shadow-soft before:absolute before:top-[30px] before:-left-1.5 before:size-3.5 before:rotate-45 before:rounded-[3px] before:bg-frost">
        <h2 className="relative text-section">{title}</h2>
        <p className="relative mt-1 text-[13px] leading-[18px] text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

/** "Ask me anything…" pill on Home: free text or voice → Clue routes it (lib/guide.ts). */
export function AskPill({
  placeholder = "Ask me anything…",
  className,
  onSend,
}: {
  placeholder?: string
  className?: string
  /** Default: read the message and go to the right screen. */
  onSend?: (text: string) => void
}) {
  const router = useRouter()
  const [v, setV] = useState("")
  const send = (t = v) => {
    const text = t.trim()
    if (!text) {
      toast("Tell Clue what happened — or what you’re looking for")
      return
    }
    setV("")
    if (onSend) onSend(text)
    else router.push(routeMessage(text))
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className={cn(
        "flex min-h-14 cursor-text items-center gap-1 rounded-[28px] bg-white py-[7px] pr-[7px] pl-5 shadow-lift focus-within:shadow-[0_10px_28px_rgb(16_40_139/0.16),inset_0_0_0_1.5px_#c9d1ee]",
        className
      )}
    >
      <textarea
        rows={1}
        value={v}
        aria-label="Ask Clue"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        placeholder={placeholder}
        className="field-sizing-content h-auto max-h-[88px] min-h-[22px] flex-1 resize-none bg-transparent p-0 text-base leading-[21px] text-navy outline-none placeholder:text-[#767fa3]"
      />
      <MicButton onText={setV} onDone={send} />
      <Button type="submit" size="icon-sm" aria-label="Send to Clue" className="size-[42px]">
        <ArrowRightIcon />
      </Button>
    </form>
  )
}

/**
 * AI field (Figma: "✧ + pink outline"): a value Clue filled in from what the user said.
 * Without `fromAi` it renders as a plain white field.
 */
export function AiField({
  icon,
  children,
  hint = "✧ from what you said",
  fromAi = true,
  className,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  hint?: React.ReactNode
  fromAi?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[46px] flex-col gap-0.5 rounded-[23px] bg-white py-[11px] pr-4 text-[15px] leading-5 font-bold text-navy shadow-[0_3px_10px_rgb(16_40_139/0.06)]",
        icon ? "pl-[42px]" : "pl-4",
        fromAi && "shadow-[0_3px_10px_rgb(16_40_139/0.06),inset_0_0_0_1.5px_var(--pink)]",
        className
      )}
    >
      {icon && <span className="absolute top-[13px] left-[15px] [&_svg]:size-[18px]">{icon}</span>}
      <span>{children}</span>
      {fromAi && hint && (
        <i className="text-[11.5px] leading-[15px] font-semibold text-pink-hint not-italic">{hint}</i>
      )}
    </div>
  )
}

/** AI dock (Figma: "Mic, text, send"): Clue's question panel pinned above the tab bar on the report. */
export function AiDock({
  question,
  placeholder = "Type or say it…",
  sendLabel = "Send",
  skippable,
  className,
}: {
  question: React.ReactNode
  placeholder?: string
  sendLabel?: string
  skippable?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[24px] bg-white/94 px-3.5 pt-2.5 pb-3 shadow-[0_10px_30px_rgb(16_40_139/0.14)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Clue state="thinking" width={34} alt="" />
        <p className="flex-1 text-sm leading-[19px] font-semibold text-navy">{question}</p>
        {skippable && (
          <button type="button" className="shrink-0 cursor-pointer text-xs text-muted-foreground underline">
            Skip
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Speak"
          className="shrink-0 bg-white shadow-[0_4px_12px_rgb(16_40_139/0.1)]"
        >
          <Image src="/assets/mic.svg" alt="" width={22} height={22} />
        </Button>
        <input
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-[22px] bg-[#f1f4fb] px-3.5 text-[15px] text-navy outline-none placeholder:text-periwinkle-2 focus:bg-white focus:shadow-[inset_0_0_0_1.5px_var(--navy)]"
        />
        <Button type="button" className="h-11 shrink-0 px-4">
          {sendLabel}
        </Button>
      </div>
    </div>
  )
}
