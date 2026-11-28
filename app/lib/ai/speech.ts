"use client"

/* Voice input with the Web Speech API (Chrome, Edge, Safari), ported from the prototype's `dictate`.
   Tap once to listen, tap again to stop. Falls back to typing with a short explanation. */

import { useCallback, useRef, useState } from "react"

import { toast } from "@/lib/toast"

type Rec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: (e: { error: string }) => void
  onend: () => void
  start(): void
  stop(): void
}

function recogniser(): (new () => Rec) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useDictation({
  onText,
  onDone,
}: {
  /** Live text while the person speaks. */
  onText?: (text: string) => void
  /** Final text when they stop. */
  onDone?: (text: string) => void
}) {
  const [listening, setListening] = useState(false)
  const rec = useRef<Rec | null>(null)

  const toggle = useCallback(() => {
    const SR = recogniser()
    if (!SR) {
      const inApp = /WhatsApp|FBAN|FBAV|Instagram|Telegram|Line\//i.test(navigator.userAgent)
      toast(
        inApp
          ? "The mic doesn’t work inside this app’s browser — open the link in Safari or Chrome"
          : "Voice input isn’t supported in this browser — try Chrome, Edge or Safari, or type"
      )
      return
    }
    if (rec.current) {
      rec.current.stop()
      return
    }
    const r = new SR()
    r.lang = /^ru/i.test(navigator.language) ? "ru-RU" : "en-US"
    r.interimResults = true
    r.maxAlternatives = 1
    r.continuous = false
    let text = ""
    r.onresult = (e) => {
      text = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join("")
      onText?.(text)
    }
    r.onerror = (e) =>
      toast(
        e.error === "not-allowed"
          ? "Microphone access is blocked — allow it for this site, or type"
          : e.error === "no-speech"
            ? "Didn’t catch that — try again"
            : "Voice input failed — please type"
      )
    r.onend = () => {
      rec.current = null
      setListening(false)
      if (text.trim()) onDone?.(text.trim())
    }
    rec.current = r
    setListening(true)
    try {
      r.start()
    } catch {
      rec.current = null
      setListening(false)
      toast("Voice input failed — please type")
    }
  }, [onText, onDone])

  return { listening, toggle }
}
