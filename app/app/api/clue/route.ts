/* Clue chat → local Ollama. POST streams the reply as plain text; GET says whether the model is available. */

import type { ChatMsg } from "@/lib/store"
import { ndjsonToText, ollamaChat, ollamaHealth, type OllamaMessage } from "@/lib/ai/ollama"

export async function GET() {
  return Response.json(await ollamaHealth())
}

export async function POST(request: Request) {
  let messages: OllamaMessage[]
  try {
    const body = (await request.json()) as { messages?: ChatMsg[] }
    messages = (body.messages ?? [])
      .filter((m) => m && typeof m.text === "string" && m.text.trim())
      .map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text.slice(0, 2000) }))
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 })
  }
  if (!messages.length || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "The last message must be from the user" }, { status: 400 })
  }

  try {
    const body = await ollamaChat(messages, request.signal)
    return new Response(ndjsonToText(body), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    })
  } catch (e) {
    return Response.json({ error: "Local AI unavailable", detail: String(e) }, { status: 503 })
  }
}
