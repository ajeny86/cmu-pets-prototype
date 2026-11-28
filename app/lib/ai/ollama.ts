/* Clue's chat on a local model via Ollama (https://ollama.com). Server only: imported by app/api/clue.
   Defaults work with `ollama serve` + `ollama pull qwen3.5:4b`; override with OLLAMA_URL / OLLAMA_MODEL. */

export const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "")
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:4b"

export type OllamaRole = "system" | "user" | "assistant"
export type OllamaMessage = { role: OllamaRole; content: string }

export const CLUE_SYSTEM = `You are Clue, the friendly AI guide in "buddy", a pet app for lost & found pets, adoption, pet care services and a pet shop.
- Reply in the same language the user writes in.
- Keep replies short: 2 to 4 sentences, warm and practical. Plain text only, no markdown, no lists.
- Lost pet: be kind, give one or two concrete first steps (search nearby, ask neighbours, check shelters and vets, share a photo). Don't ask for the pet's details in chat: the lost report form collects them, and there's a button to it under your reply.
- Found pet: thank them, suggest checking for a collar or tag and taking a photo. The app helps them make a found report.
- Health: never diagnose. If anything sounds urgent (bleeding, poisoning, breathing trouble, injury), tell them to go to a 24h vet now.
- Adoption, services and shop: give a helpful short answer. The app shows buttons to the right screen under your reply, so don't invent links, prices, pets or reports.
- If you don't know or it's outside pets, say so briefly and offer what you can help with.`

/** Starts a streamed chat. Returns Ollama's NDJSON body; throws if Ollama can't be reached or answers with an error. */
export async function ollamaChat(messages: OllamaMessage[], signal?: AbortSignal) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: CLUE_SYSTEM }, ...messages.slice(-12)],
      stream: true,
      think: false,
      options: { temperature: 0.6 },
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Ollama ${res.status}: ${detail.slice(0, 200)}`)
  }
  return res.body
}

/** Turns Ollama's NDJSON stream into plain text: just the reply as it's written. */
export function ndjsonToText(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buf = ""
  const emit = (line: string, out: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.trim()) return
    try {
      const j = JSON.parse(line) as { message?: { content?: string }; error?: string }
      if (j.error) out.error(new Error(j.error))
      else if (j.message?.content) out.enqueue(encoder.encode(j.message.content))
    } catch {
      // a broken line: skip it
    }
  }
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, out) {
        buf += decoder.decode(chunk, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const l of lines) emit(l, out)
      },
      flush(out) {
        emit(buf + decoder.decode(), out)
      },
    })
  )
}

/** Is Ollama up, and is the model there? */
export async function ollamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500), cache: "no-store" })
    if (!res.ok) return { ok: false, model: OLLAMA_MODEL, installed: false }
    const { models = [] } = (await res.json()) as { models?: { name: string; model?: string }[] }
    const want = OLLAMA_MODEL.includes(":") ? OLLAMA_MODEL : `${OLLAMA_MODEL}:latest`
    const installed = models.some((m) => m.name === want || m.model === want || m.name === OLLAMA_MODEL)
    return { ok: installed, model: OLLAMA_MODEL, installed }
  } catch {
    return { ok: false, model: OLLAMA_MODEL, installed: false }
  }
}
