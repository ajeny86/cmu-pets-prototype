"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { chatReply, isQuestion, REPORT_PATH, startLostReport } from "@/lib/guide"
import { clueStatus, streamClue, type ClueStatus } from "@/lib/ai/clue-chat"
import { CHAT_HELLO, getState, update, useBuddy } from "@/lib/store"
import { Clue } from "@/components/buddy/clue"
import { AskBar } from "@/components/buddy/kit"
import { BackLink } from "@/components/buddy/page-title"
import { cn } from "@/lib/utils"

export function Chat() {
  const s = useBuddy()
  const router = useRouter()
  const [typing, setTyping] = useState(false)
  const [status, setStatus] = useState<ClueStatus | null | undefined>(undefined)
  const end = useRef<HTMLDivElement>(null)
  const live = useRef<AbortController | null>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [s.chat, typing])

  useEffect(() => {
    let on = true
    clueStatus().then((st) => on && setStatus(st))
    return () => {
      on = false
      live.current?.abort()
    }
  }, [])

  const send = async (text: string) => {
    live.current?.abort() // a new message stops the reply still being written
    const ctl = new AbortController()
    live.current = ctl

    // links and intent stay rule-based, so the buttons always go to the right screen
    const r = chatReply(text)
    update((st) => {
      st.chat.push({ from: "me", text })
    })

    // "I lost my dog Rex yesterday": fill the form from the message and open it, like Home does
    if (r.intent === "lost" && !isQuestion(text)) {
      setTyping(false)
      startLostReport(text)
      update((st) => {
        st.chat.push({ from: "ai", text: "I’m sorry. I’ve started the report from what you told me — opening it so you can add what’s missing.", links: [{ href: REPORT_PATH, label: "Open the report" }] })
      })
      router.push(REPORT_PATH)
      return
    }
    // buttons only when the message is clearly about one part of the app; the AI's answer stands on its own otherwise
    const links = r.intent === "lost" ? [{ href: REPORT_PATH, label: "Report a lost pet" }] : r.intent ? r.links : undefined
    const history = getState().chat
    setTyping(true)

    // the reply streams in; the store is written in small batches, not on every token
    let at = -1
    let pending = ""
    let timer: ReturnType<typeof setTimeout> | undefined
    const flush = () => {
      timer = undefined
      if (!pending || ctl.signal.aborted) return
      const t = pending
      pending = ""
      update((st) => {
        if (at < 0 || !st.chat[at]) {
          st.chat.push({ from: "ai", text: "", links })
          at = st.chat.length - 1
        }
        st.chat[at].text += t
      })
      setTyping(false)
    }

    try {
      await streamClue(
        history,
        (t) => {
          pending += t
          timer ??= setTimeout(flush, 60)
        },
        ctl.signal
      )
      clearTimeout(timer)
      flush()
    } catch {
      clearTimeout(timer)
      if (ctl.signal.aborted) return
      flush()
      // local model off or failed: today's rule-based reply
      const fallback = r.intent === "lost" ? { text: "Search the area where you last saw your pet, ask neighbours and call nearby vets and shelters. A lost report lets me search nearby for you.", links } : { text: r.text, links: r.links }
      if (at < 0) update((st) => void st.chat.push({ from: "ai", ...fallback }))
      setStatus((st) => (st ? { ...st, ok: false } : st))
    } finally {
      if (live.current === ctl) {
        live.current = null
        setTyping(false)
      }
    }
  }

  const clear = () => {
    live.current?.abort()
    setTyping(false)
    update((st) => void (st.chat = [CHAT_HELLO]))
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <BackLink href="/">Home</BackLink>
        {s.chat.length > 1 && (
          <button type="button" className="cursor-pointer text-xs font-semibold text-muted-foreground hover:underline" onClick={clear}>
            Clear chat
          </button>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Clue state="thinking" width={56} />
        <div>
          <h1 className="text-section">Clue · Chat</h1>
          <p className="text-xs text-muted-foreground">
            {status === undefined
              ? "Your AI guide · runs on this device"
              : status?.ok
                ? `Your AI guide · ${status.model} on this device`
                : "Your AI guide · local AI off, simple replies"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 rounded-card bg-white/60 p-3 md:min-h-[420px] md:p-5" aria-live="polite">
        {s.chat.map((m, i) => (
          <div key={i} className={cn("flex max-w-[85%] flex-col gap-2", m.from === "me" ? "self-end items-end" : "self-start")}>
            <p
              className={cn(
                "rounded-[20px] px-3.5 py-2.5 text-[14px] leading-[19px] whitespace-pre-line",
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
