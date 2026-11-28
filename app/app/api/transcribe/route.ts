/* Voice → text on this computer.
   GET: which local engines are up: Parakeet (realtime sidecar, app/stt-server) and Whisper (whisper.cpp).
   POST: a 16 kHz mono WAV → { text } with Whisper, the fallback when Parakeet isn't running. */

import { transcribe, whisperHealth } from "@/lib/ai/whisper"

const MAX_BYTES = 10 * 1024 * 1024 // ~5 minutes of 16 kHz mono
const STT_URL = (process.env.STT_URL || "http://127.0.0.1:8765").replace(/\/+$/, "")

async function parakeetHealth() {
  try {
    const res = await fetch(`${STT_URL}/health`, { signal: AbortSignal.timeout(1000), cache: "no-store" })
    const j = res.ok ? ((await res.json()) as { ok?: boolean; model?: string }) : {}
    return { parakeet: !!j.ok, parakeetModel: j.model ?? null }
  } catch {
    return { parakeet: false, parakeetModel: null }
  }
}

export async function GET() {
  return Response.json({ ...whisperHealth(), ...(await parakeetHealth()) })
}

export async function POST(request: Request) {
  if (!whisperHealth().ok) return Response.json({ error: "Local speech model not installed" }, { status: 503 })
  const body = new Uint8Array(await request.arrayBuffer())
  if (body.byteLength < 44 || body.byteLength > MAX_BYTES) return Response.json({ error: "Send a WAV recording up to 5 minutes" }, { status: 400 })
  const lang = new URL(request.url).searchParams.get("lang")
  try {
    const text = await transcribe(body, lang && /^[a-z]{2}$/.test(lang) ? lang : "auto", request.signal)
    return Response.json({ text })
  } catch (e) {
    return Response.json({ error: "Transcription failed", detail: String(e).slice(0, 300) }, { status: 500 })
  }
}
