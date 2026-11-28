"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { bindReport, FOUND_REPORTS, parseWhen, ruleVerdict } from "@/lib/ai/engine"
import { loadMobilenet, modelSource, readPhoto, shrinkPhoto, type PhotoReading } from "@/lib/ai/photo"
import { freshDraft, parseInto, understand, type LostDraft } from "@/lib/ai/story"
import { INTENT_PATH } from "@/lib/guide"
import { findMatch } from "@/lib/match"
import { DEFAULT_CENTER } from "@/lib/demo-data"
import { useBuddy } from "@/lib/store"
import { MicButton, PetPhoto, PhotoPicker } from "@/components/buddy/kit"
import { Button } from "@/components/ui/button"

function Panel({ title, sub, children, className }: { title: string; sub: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-card bg-white p-4 shadow-soft md:p-5", className)}>
      <div>
        <h2 className="text-base font-extrabold">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </section>
  )
}

const Out = ({ children }: { children: React.ReactNode }) => (
  <pre className="max-h-[280px] overflow-auto rounded-[12px] bg-[#0c1f70] p-3 font-mono text-[11.5px] leading-[16px] whitespace-pre-wrap text-[#e6eaf8]">{children}</pre>
)

function readEnv(): Record<string, string> {
  const w = window as unknown as Record<string, unknown>
  const gl = !!document.createElement("canvas").getContext("webgl2")
  let storage = "blocked"
  try {
    storage = `${Math.round((localStorage.getItem("buddy:v1")?.length ?? 0) / 1024)} KB used`
  } catch {}
  return {
    "Voice input": w.SpeechRecognition || w.webkitSpeechRecognition ? "supported" : "not supported in this browser",
    WebGL2: gl ? "yes (fast)" : "no (slower CPU fallback)",
    Location: "geolocation" in navigator ? "available" : "not available",
    Storage: storage,
  }
}

function Env() {
  const [env, setEnv] = useState<Record<string, string>>({})
  useEffect(() => {
    const t = setTimeout(() => setEnv(readEnv()), 0)
    return () => clearTimeout(t)
  }, [])
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs md:grid-cols-4">
      {Object.entries(env).map(([k, v]) => (
        <div key={k}>
          <dt className="font-bold">{k}</dt>
          <dd className="text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function PhotoLab() {
  const [src, setSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [r, setR] = useState<PhotoReading | null>(null)
  const run = async (url: string) => {
    setSrc(url)
    setR(null)
    setBusy("Loading the model (first time only)…")
    try {
      await loadMobilenet()
    } catch {
      setBusy("Couldn’t load the model — the first download needs a connection")
      return
    }
    setBusy("Reading the photo…")
    setR(await readPhoto(url))
    setBusy(null)
  }
  return (
    <Panel title="Photo recognition" sub="MobileNet v2 (TensorFlow.js) + coat colour from the centre of the image">
      <div className="flex flex-wrap gap-2">
        <PhotoPicker onFile={async (f) => run(await shrinkPhoto(f))} variant="outline" className="h-10" />
        <Button variant="outline" className="h-10" onClick={() => run("/assets/max.webp")}>
          Example photo
        </Button>
      </div>
      {src && (
        <div className="flex items-start gap-3">
          <PetPhoto src={src} size={96} />
          <div className="text-sm">
            {busy && <p className="animate-pulse text-pink-ink">{busy}</p>}
            {r && (
              <>
                <p>
                  <b>Kind:</b> {r.kind ?? "— not sure"} {r.conf ? `(${Math.round(r.conf * 100)}%)` : ""}
                </p>
                <p>
                  <b>Breed:</b> {r.breed ?? "—"}
                </p>
                <p>
                  <b>Colour:</b> {r.colour ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.ms ? `${r.ms} ms` : ""}
                  {modelSource ? ` · model from ${modelSource === "cache" ? "this device" : "the network (now saved)"}` : ""}
                  {r.failed ? " · recognition failed" : ""}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {r?.top && <Out>{r.top.map((t) => `${(t.probability * 100).toFixed(1).padStart(5)}%  ${t.className}`).join("\n")}</Out>}
    </Panel>
  )
}

const SAMPLES = [
  "I lost my cat Luna near Central Park in Lisbon this morning, she is small and ginger with a red collar",
  "yesterday evening my dog Rex ran away from Market Square",
  "Z gjnthzkf cj,fre",
  "found a black dog near the station",
]

function StoryLab() {
  const [text, setText] = useState(SAMPLES[0])
  const u = understand(text)
  const { draft, found } = parseInto(freshDraft(), u.text)
  const when = parseWhen(u.text)
  const fields = draft.fields.filter((f) => f.v).map((f) => `${f.label.padEnd(18)} ${f.v}  [${f.s}]`).join("\n")
  return (
    <Panel title="Story → report" sub="Typo + keyboard-layout fixes, then the report fields (EN + RU)">
      <div className="flex items-start gap-1.5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="field-sizing-content min-h-[70px] flex-1 rounded-[14px] bg-mint p-3 text-sm text-navy outline-none focus:shadow-[inset_0_0_0_1.5px_var(--navy)]" />
        <MicButton onText={setText} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button key={s} type="button" onClick={() => setText(s)} className="cursor-pointer rounded-full bg-tint px-2.5 py-1 text-[11px] font-semibold">
            {s.slice(0, 28)}…
          </button>
        ))}
      </div>
      <Out>
        {[
          `intent:  ${u.intent ?? "unclear → /where-to"}`,
          `fixes:   ${u.fixes.length ? u.fixes.map(([a, b]) => `${a} → ${b}`).join(", ") : "none"}`,
          `text:    ${u.text}`,
          `when:    ${when ? JSON.stringify(when) : "—"}`,
          "",
          fields || "no fields found",
          "",
          `found: ${JSON.stringify(found)}`,
        ].join("\n")}
      </Out>
    </Panel>
  )
}

function IntentLab() {
  const [text, setText] = useState("my dog needs vaccines")
  const u = understand(text)
  return (
    <Panel title="Intent routing" sub="Where Home and Chat send a message">
      <input value={text} onChange={(e) => setText(e.target.value)} className="h-11 rounded-full bg-mint px-4 text-sm text-navy outline-none focus:shadow-[inset_0_0_0_1.5px_var(--navy)]" />
      <Out>{`${u.intent ?? "unclear"}  →  ${u.intent ? INTENT_PATH[u.intent] : "/where-to"}`}</Out>
    </Panel>
  )
}

function MatchLab() {
  const s = useBuddy()
  const options: { id: string; label: string; d: LostDraft }[] = [
    { id: "draft", label: "Current draft", d: s.draft },
    ...s.reports.map((r) => ({ id: r.id, label: `Report · ${r.draft.pet || r.draft.species || "pet"}`, d: r.draft })),
  ]
  const [pick, setPick] = useState("draft")
  const d = (options.find((o) => o.id === pick) ?? options[0]).d
  const lost = bindReport(structuredClone(d)).lostForRule()
  const best = findMatch(d, d.lostPin ?? DEFAULT_CENTER, s.foundReports)
  const rows = FOUND_REPORTS.map((f) => {
    const v = ruleVerdict(lost, f)
    return `${v.verdict.padEnd(6)} ${String(v.score).padStart(2)}  ${f.desc.padEnd(24)} ${v.clues.map(([c, p]) => `${c} (${p > 0 ? "+" : ""}${p})`).join(", ")}`
  })
  return (
    <Panel title="Matching (Lab 01 rule)" sub="Colour +2 · look-alike +1 · within 2 km +2 · size +1 · fresh +1 · old −2 · match ≥ 5, maybe ≥ 2" className="md:col-span-2">
      <select value={pick} onChange={(e) => setPick(e.target.value)} className="h-10 w-fit rounded-full bg-mint px-3 text-sm">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <Out>
        {[
          `lost:  ${JSON.stringify({ ...lost, lostDay: new Date(lost.lostDay).toISOString().slice(0, 10) })}`,
          "",
          ...rows,
          "",
          `+ ${s.foundReports.length} found report(s) on this device`,
          `best: ${best ? `${best.desc} · ${best.score} points · ${best.verdict}` : "none"}`,
        ].join("\n")}
      </Out>
    </Panel>
  )
}

export function AiLab() {
  return (
    <div className="flex flex-col gap-4">
      <Env />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PhotoLab />
        <StoryLab />
        <IntentLab />
        <MatchLab />
      </div>
    </div>
  )
}
