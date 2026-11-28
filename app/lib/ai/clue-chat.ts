/* Browser side of Clue's chat: streams a reply from app/api/clue (local Ollama). */

import type { ChatMsg } from "@/lib/store"

export type ClueStatus = { ok: boolean; model: string; installed: boolean }

/** Streams Clue's reply, calling `onChunk` as text arrives. Throws if the local model isn't available. */
export async function streamClue(history: ChatMsg[], onChunk: (text: string) => void, signal?: AbortSignal) {
  const res = await fetch("/api/clue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history.map(({ from, text }) => ({ from, text })) }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`Clue ${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let all = ""
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const t = decoder.decode(value, { stream: true })
    if (t) {
      all += t
      onChunk(t)
    }
  }
  if (!all.trim()) throw new Error("Clue: empty reply")
  return all
}

export async function clueStatus(): Promise<ClueStatus | null> {
  try {
    const res = await fetch("/api/clue", { cache: "no-store" })
    return res.ok ? ((await res.json()) as ClueStatus) : null
  } catch {
    return null
  }
}
