"use client"

/* Voice input. Tap once to talk, tap again to stop.
   1. Local Whisper (app/api/transcribe, whisper.cpp on this computer) when it's set up: the mic is recorded here,
      sent to the local server and transcribed. It waits for you: it stops when you tap, or after a long
      silence once you've started speaking, so pauses between sentences don't cut you off.
   2. Otherwise the browser's Web Speech API (Chrome, Edge, Safari), in continuous mode, with live text. */

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "@/lib/toast"

/** Silence after speech that ends the recording (ms). Long enough for a pause to think. */
const END_SILENCE = 2500
/** No speech at all for this long → stop and say so. */
const NO_SPEECH = 8000
const MAX_LENGTH = 90_000

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

let whisperP: Promise<boolean> | null = null
/** Is local Whisper set up? Asked once per page load. */
export function whisperReady() {
  whisperP ??= fetch("/api/transcribe", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { ok: false }))
    .then((j: { ok?: boolean }) => !!j.ok)
    .catch(() => false)
  return whisperP
}

const canRecord = () => typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"

/** Any recording the browser makes (webm, mp4…) → 16 kHz mono 16-bit WAV, what Whisper reads. */
async function toWav16k(blob: Blob) {
  const ac = new AudioContext()
  const decoded = await ac.decodeAudioData(await blob.arrayBuffer())
  void ac.close()
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000)
  const src = off.createBufferSource()
  src.buffer = decoded
  src.connect(off.destination)
  src.start()
  const pcm = (await off.startRendering()).getChannelData(0)
  const out = new DataView(new ArrayBuffer(44 + pcm.length * 2))
  const str = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)))
  str(0, "RIFF")
  out.setUint32(4, 36 + pcm.length * 2, true)
  str(8, "WAVE")
  str(12, "fmt ")
  out.setUint32(16, 16, true)
  out.setUint16(20, 1, true) // PCM
  out.setUint16(22, 1, true) // mono
  out.setUint32(24, 16000, true)
  out.setUint32(28, 32000, true)
  out.setUint16(32, 2, true)
  out.setUint16(34, 16, true)
  str(36, "data")
  out.setUint32(40, pcm.length * 2, true)
  pcm.forEach((v, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true))
  return new Blob([out.buffer], { type: "audio/wav" })
}

const micError = (e: unknown) =>
  toast(
    e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
      ? "Microphone access is blocked — allow it for this site, or type"
      : "Couldn’t start the microphone — please type"
  )

export function useDictation({
  onText,
  onDone,
}: {
  /** Text while the person speaks (browser mode) or once it's transcribed (Whisper). */
  onText?: (text: string) => void
  /** Final text when they stop. */
  onDone?: (text: string) => void
}) {
  const [listening, setListening] = useState(false)
  /** Whisper is turning the recording into text. */
  const [busy, setBusy] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (canRecord()) void whisperReady()
    return () => stopRef.current?.()
  }, [])

  const withWhisper = useCallback(async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
    } catch (e) {
      micError(e)
      return
    }
    const rec = new MediaRecorder(stream)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)

    // a simple voice-activity check: has the person started, and have they gone quiet?
    const ac = new AudioContext()
    const an = ac.createAnalyser()
    an.fftSize = 2048
    ac.createMediaStreamSource(stream).connect(an)
    const buf = new Float32Array(an.fftSize)
    const t0 = performance.now()
    let spoke = false
    let lastVoice = t0
    // background level: drops at once to quiet moments, rises only slowly, so speech
    // that starts the moment you tap isn't mistaken for room noise
    let floor = 0.004
    const timer = setInterval(() => {
      an.getFloatTimeDomainData(buf)
      const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length)
      const now = performance.now()
      floor = rms < floor ? Math.max(rms, 0.001) : floor + (rms - floor) * 0.005
      if (rms > Math.max(0.012, floor * 3)) {
        spoke = true
        lastVoice = now
      }
      if ((spoke && now - lastVoice > END_SILENCE) || (!spoke && now - t0 > NO_SPEECH) || now - t0 > MAX_LENGTH) stop()
    }, 100)

    const stop = () => {
      clearInterval(timer)
      if (rec.state !== "inactive") rec.stop()
    }
    stopRef.current = stop

    rec.onstop = async () => {
      stopRef.current = null
      stream.getTracks().forEach((t) => t.stop())
      void ac.close()
      setListening(false)
      // nothing loud enough heard and it's very short: nothing to send (Whisper filters noise in the rest)
      if (!spoke && performance.now() - t0 < 1500) return toast("Didn’t catch that — try again")
      setBusy(true)
      try {
        const wav = await toWav16k(new Blob(chunks, { type: rec.mimeType }))
        const res = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav })
        if (!res.ok) throw new Error(String(res.status))
        const { text } = (await res.json()) as { text: string }
        if (!text.trim()) return toast("Didn’t catch that — try again")
        onText?.(text.trim())
        onDone?.(text.trim())
      } catch {
        toast("Couldn’t turn that into text — please type")
      } finally {
        setBusy(false)
      }
    }
    rec.start(250)
    setListening(true)
  }, [onText, onDone])

  const withBrowser = useCallback(() => {
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
    const r = new SR()
    r.lang = navigator.language || "en-US"
    r.interimResults = true
    r.maxAlternatives = 1
    r.continuous = true // keep listening through pauses; tap again to stop
    let text = ""
    r.onresult = (e) => {
      text = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ")
        .replace(/\s+/g, " ")
      onText?.(text)
    }
    r.onerror = (e) => {
      if (e.error === "aborted") return
      toast(
        e.error === "not-allowed"
          ? "Microphone access is blocked — allow it for this site, or type"
          : e.error === "no-speech"
            ? "Didn’t catch that — try again"
            : "Voice input failed — please type"
      )
    }
    r.onend = () => {
      stopRef.current = null
      setListening(false)
      if (text.trim()) onDone?.(text.trim())
    }
    stopRef.current = () => r.stop()
    setListening(true)
    try {
      r.start()
    } catch {
      stopRef.current = null
      setListening(false)
      toast("Voice input failed — please type")
    }
  }, [onText, onDone])

  const toggle = useCallback(async () => {
    if (stopRef.current) return stopRef.current()
    if (busy) return
    if (canRecord() && (await whisperReady())) return withWhisper()
    withBrowser()
  }, [busy, withWhisper, withBrowser])

  return { listening, busy, toggle }
}
