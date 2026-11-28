"use client"

/* Voice input. Tap once to talk, tap again to stop. Three engines, best first:
   1. Parakeet (realtime): the app/stt-server sidecar on this computer. The mic is streamed over a WebSocket
      and the words appear in the box while you speak.
   2. Whisper (whisper.cpp via app/api/transcribe): records the phrase, then turns it into text.
   3. The browser's own speech recognition (Chrome, Edge, Safari).
   Parakeet and Whisper wait for you: they stop when you tap, or after a long silence once you've
   started speaking, so pauses between sentences don't cut you off. */

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "@/lib/toast"

/** Silence after speech that ends the recording (ms). Long enough for a pause to think. */
const END_SILENCE = 2500
/** No speech at all for this long → stop and say so. */
const NO_SPEECH = 8000
const MAX_LENGTH = 90_000
const STT_WS = process.env.NEXT_PUBLIC_STT_WS || "ws://127.0.0.1:8765/stream"

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

type Engines = { parakeet: boolean; whisper: boolean }
let enginesP: Promise<Engines> | null = null
/** Which local speech engines are running? Asked once per page load. */
export function localEngines() {
  enginesP ??= fetch("/api/transcribe", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: { ok?: boolean; parakeet?: boolean }) => ({ parakeet: !!j.parakeet, whisper: !!j.ok }))
    .catch(() => ({ parakeet: false, whisper: false }))
  return enginesP
}
/** Parakeet stopped answering: use Whisper for the rest of this page load. */
function parakeetDown() {
  enginesP = localEngines().then((e) => ({ ...e, parakeet: false }))
}

const canRecord = () => typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"

const micError = (e: unknown) =>
  toast(
    e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
      ? "Microphone access is blocked — allow it for this site, or type"
      : "Couldn’t start the microphone — please type"
  )

const getMic = () => navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })

/** Has the person started speaking, and have they gone quiet? Fed a loudness (RMS) value every ~100 ms. */
function silenceDetector() {
  const t0 = performance.now()
  let spoke = false
  let lastVoice = t0
  // background level: drops at once to quiet moments, rises only slowly, so speech
  // that starts the moment you tap isn't mistaken for room noise
  let floor = 0.004
  return {
    t0,
    get spoke() {
      return spoke
    },
    /** True when it's time to stop. */
    check(rms: number) {
      const now = performance.now()
      floor = rms < floor ? Math.max(rms, 0.001) : floor + (rms - floor) * 0.005
      if (rms > Math.max(0.012, floor * 3)) {
        spoke = true
        lastVoice = now
      }
      return (spoke && now - lastVoice > END_SILENCE) || (!spoke && now - t0 > NO_SPEECH) || now - t0 > MAX_LENGTH
    },
  }
}

/* AudioWorklet: mic audio at the device rate → 16 kHz mono float32 (linear resampling) + loudness. */
const WORKLET = `
class BuddyPcm16k extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.prev = 0 }
  process(inputs) {
    const x = inputs[0] && inputs[0][0]
    if (!x || !x.length) return true
    let sq = 0
    for (let k = 0; k < x.length; k++) sq += x[k] * x[k]
    const out = new Float32Array(Math.ceil(x.length / this.ratio) + 2)
    let n = 0
    for (;;) {
      const i = Math.floor(this.pos)
      if (i + 1 >= x.length) break
      const a = i < 0 ? this.prev : x[i], b = x[i + 1]
      out[n++] = a + (b - a) * (this.pos - i)
      this.pos += this.ratio
    }
    this.pos -= x.length
    this.prev = x[x.length - 1]
    this.port.postMessage({ pcm: out.slice(0, n), rms: Math.sqrt(sq / x.length) }, [])
    return true
  }
}
registerProcessor("buddy-pcm-16k", BuddyPcm16k)
`

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

/** Opens the realtime socket; null if the sidecar doesn't answer within 2 s. */
function openSocket(): Promise<WebSocket | null> {
  return new Promise((resolve) => {
    let ws: WebSocket
    try {
      ws = new WebSocket(STT_WS)
    } catch {
      return resolve(null)
    }
    ws.binaryType = "arraybuffer"
    const t = setTimeout(() => {
      ws.close()
      resolve(null)
    }, 2000)
    ws.onopen = () => {
      clearTimeout(t)
      resolve(ws)
    }
    ws.onerror = () => {
      clearTimeout(t)
      resolve(null)
    }
  })
}

export function useDictation({
  onText,
  onDone,
}: {
  /** Text while the person speaks (Parakeet, browser) or once it's transcribed (Whisper). */
  onText?: (text: string) => void
  /** Final text when they stop. */
  onDone?: (text: string) => void
}) {
  const [listening, setListening] = useState(false)
  /** Turning the last of the recording into text. */
  const [busy, setBusy] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (canRecord()) void localEngines()
    return () => stopRef.current?.()
  }, [])

  const withWhisper = useCallback(async () => {
    let stream: MediaStream
    try {
      stream = await getMic()
    } catch (e) {
      micError(e)
      return
    }
    const rec = new MediaRecorder(stream)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)

    const ac = new AudioContext()
    const an = ac.createAnalyser()
    an.fftSize = 2048
    ac.createMediaStreamSource(stream).connect(an)
    const buf = new Float32Array(an.fftSize)
    const det = silenceDetector()
    const timer = setInterval(() => {
      an.getFloatTimeDomainData(buf)
      if (det.check(Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length))) stop()
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
      if (!det.spoke && performance.now() - det.t0 < 1500) return toast("Didn’t catch that — try again")
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

  /** Parakeet: stream the mic to the local sidecar; the box fills in as you speak. Returns false if it couldn't start. */
  const withParakeet = useCallback(async (): Promise<boolean> => {
    let stream: MediaStream
    try {
      stream = await getMic()
    } catch (e) {
      micError(e)
      return true // the mic is the problem, not Parakeet
    }
    const ac = new AudioContext()
    const release = () => {
      stream.getTracks().forEach((t) => t.stop())
      void ac.close()
    }
    let node: AudioWorkletNode
    try {
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }))
      await ac.audioWorklet.addModule(url)
      URL.revokeObjectURL(url)
      node = new AudioWorkletNode(ac, "buddy-pcm-16k")
    } catch {
      release()
      return false
    }
    const ws = await openSocket()
    if (!ws) {
      release()
      return false
    }

    let text = ""
    let stopped = false
    let finished = false
    let finalTimer: ReturnType<typeof setTimeout> | undefined
    let pending: Float32Array[] = []
    let pendingLen = 0
    let loud = 0
    let ticks = 0
    const det = silenceDetector()

    const sendPcm = () => {
      if (!pendingLen || ws.readyState !== WebSocket.OPEN) return
      const pcm = new Float32Array(pendingLen)
      let o = 0
      for (const p of pending) {
        pcm.set(p, o)
        o += p.length
      }
      pending = []
      pendingLen = 0
      ws.send(pcm.buffer)
    }
    node.port.onmessage = (e: MessageEvent<{ pcm: Float32Array; rms: number }>) => {
      if (stopped) return
      loud += e.data.rms
      ticks++
      pending.push(e.data.pcm)
      pendingLen += e.data.pcm.length
      if (pendingLen >= 2560) sendPcm() // ~160 ms
    }
    ac.createMediaStreamSource(stream).connect(node)
    node.connect(ac.destination) // silent output; keeps the worklet running

    const timer = setInterval(() => {
      const rms = ticks ? loud / ticks : 0
      loud = 0
      ticks = 0
      if (det.check(rms)) stop()
    }, 100)

    const finish = (t: string) => {
      if (finished) return
      finished = true
      clearTimeout(finalTimer)
      setBusy(false)
      stopRef.current = null
      if (ws.readyState === WebSocket.OPEN) ws.close()
      const s = t.trim()
      if (!s) return toast("Didn’t catch that — try again")
      onText?.(s)
      onDone?.(s)
    }
    const stop = () => {
      if (stopped) return
      stopped = true
      clearInterval(timer)
      sendPcm()
      release()
      setListening(false)
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("end")
        setBusy(true)
        finalTimer = setTimeout(() => finish(text), 5000) // the last words, or what we have
      } else finish(text)
    }
    ws.onmessage = (e) => {
      const m = JSON.parse(String(e.data)) as { type: "partial" | "final"; text: string }
      if (m.type === "partial") {
        text = m.text
        if (!stopped) onText?.(text) // live, while you speak
      } else finish(m.text)
    }
    ws.onclose = () => {
      if (finished) return
      if (!stopped) {
        parakeetDown()
        toast("Realtime voice stopped — the next tap uses the other engine")
        stop()
      }
      finish(text)
    }

    stopRef.current = stop
    setListening(true)
    return true
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
    const engines = canRecord() ? await localEngines() : { parakeet: false, whisper: false }
    if (engines.parakeet) {
      if (await withParakeet()) return
      parakeetDown()
    }
    if (engines.whisper) return withWhisper()
    withBrowser()
  }, [busy, withParakeet, withWhisper, withBrowser])

  return { listening, busy, toggle }
}
