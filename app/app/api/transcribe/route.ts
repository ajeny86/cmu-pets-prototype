/* Voice → text on this computer (whisper.cpp). POST a 16 kHz mono WAV, get { text }. GET says whether it's set up. */

import { transcribe, whisperHealth } from "@/lib/ai/whisper"

const MAX_BYTES = 10 * 1024 * 1024 // ~5 minutes of 16 kHz mono

export async function GET() {
  return Response.json(whisperHealth())
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
