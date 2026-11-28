/* Photo recognition on the device: MobileNet (ImageNet) in TensorFlow.js, loaded on first use.
   Ported from the prototype's `recognise` / `photoColour` / `shrinkPhoto`. Nothing leaves the browser
   except the one-time model download, which the browser then caches. */

import { KINDS, colourName } from "@/lib/ai/engine"

type MobileNet = {
  classify(img: HTMLImageElement, topk?: number): Promise<{ className: string; probability: number }[]>
  infer(img: HTMLImageElement, embedding?: boolean): import("@tensorflow/tfjs").Tensor
}

export type Recognition = {
  kind: string | null
  conf?: number
  breed?: string | null
  coat?: "tabby" | null
  guess?: string
  failed?: boolean
  top?: { className: string; probability: number }[]
  ms?: number
}

let modelP: Promise<MobileNet> | null = null
const CACHE = "indexeddb://buddy-mobilenet-v2"

/** Where the model came from on this page load: the browser's IndexedDB copy, or the network (first time). */
export let modelSource: "cache" | "network" | null = null

export function loadMobilenet() {
  if (!modelP) {
    modelP = (async () => {
      const tf = await import("@tensorflow/tfjs")
      await tf.ready()
      const mobilenet = await import("@tensorflow-models/mobilenet")
      // the saved copy first: after one download the photo AI works offline
      try {
        const m = await mobilenet.load({ version: 2, alpha: 1.0, modelUrl: CACHE, inputRange: [0, 1] })
        modelSource = "cache"
        return m as unknown as MobileNet
      } catch {}
      const m = await mobilenet.load({ version: 2, alpha: 1.0 })
      modelSource = "network"
      try {
        const inner = (m as unknown as { model: import("@tensorflow/tfjs").GraphModel }).model
        await inner.save(CACHE)
      } catch {
        // storage blocked or full: it still works, it just downloads again next time
      }
      return m as unknown as MobileNet
    })().catch((e) => {
      modelP = null
      throw e
    })
  }
  return modelP
}

export async function recognise(img: HTMLImageElement): Promise<Recognition> {
  const t0 = performance.now()
  const model = await loadMobilenet()
  const tf = await import("@tensorflow/tfjs")
  const top = await model.classify(img, 10)
  const logits = model.infer(img, false)
  const sm = tf.softmax(logits)
  const probs = Array.from(sm.dataSync())
  logits.dispose()
  sm.dispose()
  const off = probs.length - 1000 // some model versions keep a "background" class at 0
  const p = (i: number) => probs[i + off]
  let best: { kind: string; sum: number; bi: number; hasBreeds?: boolean } | null = null
  for (const [kind, ranges, hasBreeds] of KINDS) {
    let sum = 0
    let bi = -1
    ranges.forEach(([a, b]) => {
      for (let i = a; i <= b; i++) {
        sum += p(i)
        if (bi < 0 || p(i) > p(bi)) bi = i
      }
    })
    if (!best || sum > best.sum) best = { kind, sum, bi, hasBreeds }
  }
  const ms = Math.round(performance.now() - t0)
  if (!best || best.sum < 0.2) return { kind: null, guess: top[0]?.className.split(",")[0], top, ms }
  const hit = top.find((t) => Math.abs(t.probability - p(best.bi)) < 1e-4)
  const raw = hit ? hit.className.split(",")[0].trim() : ""
  const breed = best.hasBreeds && raw && p(best.bi) > 0.2 ? raw.replace(/\b\w/g, (c) => c.toUpperCase()) : null
  return {
    kind: best.kind,
    conf: best.sum,
    breed: breed && !/^(tabby|tiger cat|egyptian cat)$/i.test(breed) ? breed : null,
    coat: /tabby|tiger cat/i.test(raw) ? "tabby" : null,
    top,
    ms,
  }
}

/** Main coat colour, read from the centre of the picture where the animal usually is. */
export function photoColour(img: HTMLImageElement) {
  const c = document.createElement("canvas")
  const W = 48
  const H = 48
  c.width = W
  c.height = H
  const x = c.getContext("2d")!
  x.drawImage(img, 0, 0, W, H)
  const px = x.getImageData(W * 0.25, H * 0.25, W * 0.5, H * 0.5).data
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < px.length; i += 4) {
    r += px[i]
    g += px[i + 1]
    b += px[i + 2]
    n++
  }
  return colourName(r / n, g / n, b / n)
}

/** A small JPEG copy of the photo: fast to analyse and small enough to keep in localStorage. */
export function shrinkPhoto(file: Blob, max = 560): Promise<string> {
  return new Promise((ok) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      try {
        ok(c.toDataURL("image/jpeg", 0.8))
      } catch {
        ok(url)
      }
    }
    img.onerror = () => ok(url)
    img.src = url
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, bad) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => ok(img)
    img.onerror = bad
    img.src = src
  })
}

export type PhotoReading = Recognition & { colour: string | null; look: string }

/** Everything the app reads from one photo: kind, breed, colour and a short "look" line. */
export async function readPhoto(src: string): Promise<PhotoReading> {
  const img = await loadImage(src)
  const col = photoColour(img)
  let r: Recognition
  try {
    r = await recognise(img)
  } catch {
    r = { kind: null, failed: true }
  }
  const colour = r.kind ? (r.coat === "tabby" ? `${col} tabby` : col) : null
  const look = [r.kind ? r.breed : null, colour].filter(Boolean).join(", ")
  return { ...r, colour, look }
}
