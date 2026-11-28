"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { chatReply, startLostReport } from "@/lib/guide"
import { CHAT_HELLO, update, useBuddy } from "@/lib/store"
import { Clue } from "@/components/buddy/clue"
import { AskBar } from "@/components/buddy/kit"
import { BackLink } from "@/components/buddy/page-title"
import { cn } from "@/lib/utils"

export function Chat() {
  const s = useBuddy()
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [s.chat.length, typing])

  const send = (text: string) => {
    update((st) => {
      st.chat.push({ from: "me", text })
    })
    setTyping(true)
    setTimeout(() => {
      const r = chatReply(text)
      if (r.intent === "lost") startLostReport(text)
      update((st) => {
        st.chat.push({ from: "ai", text: r.text, links: r.links })
      })
      setTyping(false)
    }, 650)
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <BackLink href="/">Home</BackLink>
        {s.chat.length > 1 && (
          <button type="button" className="cursor-pointer text-xs font-semibold text-muted-foreground hover:underline" onClick={() => update((st) => void (st.chat = [CHAT_HELLO]))}>
            Clear chat
          </button>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Clue state="thinking" width={56} />
        <div>
          <h1 className="text-section">Clue · Chat</h1>
          <p className="text-xs text-muted-foreground">Your AI guide · runs on this device</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 rounded-card bg-white/60 p-3 md:min-h-[420px] md:p-5" aria-live="polite">
        {s.chat.map((m, i) => (
          <div key={i} className={cn("flex max-w-[85%] flex-col gap-2", m.from === "me" ? "self-end items-end" : "self-start")}>
            <p
              className={cn(
                "rounded-[20px] px-3.5 py-2.5 text-[14px] leading-[19px]",
                m.from === "me" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md bg-white text-navy shadow-soft"
              )}
            >
              {m.text}
            </p>
            {m.links && (
              <div className="flex flex-wrap gap-1.5">
                {m.links.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-full bg-topic-pink px-3 py-1.5 text-xs font-bold text-pink-ink hover:brightness-95">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && <p className="self-start rounded-[20px] bg-white px-3.5 py-2.5 text-navy shadow-soft">…</p>}
        <div ref={end} />
      </div>
      <AskBar placeholder="Type a message…" onSend={send} className="sticky bottom-4" />
    </div>
  )
}
