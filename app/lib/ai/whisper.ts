/* Speech to text on this computer with whisper.cpp (https://github.com/ggml-org/whisper.cpp). Server only:
   imported by app/api/transcribe. Setup: `brew install whisper-cpp` + a ggml model (see app/README.md).
   Override with WHISPER_BIN / WHISPER_MODEL. */

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { basename, join } from "node:path"

export const WHISPER_MODEL = process.env.WHISPER_MODEL || join(homedir(), ".cache/whisper/ggml-large-v3-turbo-q5_0.bin")

/** whisper-cli from WHISPER_BIN, else Homebrew's usual places, else the PATH. */
function whisperBin() {
  if (process.env.WHISPER_BIN) return process.env.WHISPER_BIN
  return ["/opt/homebrew/bin/whisper-cli", "/usr/local/bin/whisper-cli"].find((p) => existsSync(p)) ?? "whisper-cli"
}

export function whisperHealth() {
  const bin = whisperBin()
  const binOk = bin.includes("/") ? existsSync(bin) : true
  const modelOk = existsSync(WHISPER_MODEL)
  return { ok: binOk && modelOk, model: basename(WHISPER_MODEL), bin: binOk, modelFile: modelOk }
}

// what Whisper "hears" in silence or noise
const NOISE = /^\s*(\[.*\]|\(.*\)|♪+|thank you\.?|thanks for watching!?|продолжение следует\.*|субтитры .*|редактор субтитров .*|obrigad[oa]\.?)\s*$/i

/** Transcribes a 16 kHz mono WAV. `lang` is a code like "ru" or "en"; default: Whisper detects it. */
export async function transcribe(wav: Uint8Array, lang = "auto", signal?: AbortSignal) {
  const dir = await mkdtemp(join(tmpdir(), "buddy-voice-"))
  const file = join(dir, "speech.wav")
  try {
    await writeFile(file, wav)
    const out = await new Promise<string>((resolve, reject) => {
      execFile(
        whisperBin(),
        ["-m", WHISPER_MODEL, "-f", file, "-l", lang, "-nt", "-np"],
        { timeout: 60_000, maxBuffer: 1 << 20, signal },
        (err, stdout) => (err ? reject(err) : resolve(stdout))
      )
    })
    const text = out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !NOISE.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    return text
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
