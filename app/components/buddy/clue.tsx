import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Clue, the AI guide, in the pose that matches the moment (Figma · Design System · "Clue").
 * Which pose goes where:
 *   hello      Home / Welcome  — intro, main state
 *   search     Search          — helping you search
 *   thinking   Ask / Chat      — thinking, working
 *   success    Success         — found, done
 *   no-results No results      — no matches (yet)
 *   not-found  Page not found  — 404
 *   loading    Loading         — searching, processing
 *   empty      Empty state     — start a search, get help
 */
export const cluePoses = {
  hello: { file: "clue-hello", w: 386, h: 336, label: "Home / Welcome", use: "Intro / main state" },
  search: { file: "clue-search", w: 369, h: 329, label: "Search", use: "Helping you search" },
  thinking: { file: "clue-laptop", w: 379, h: 315, label: "Ask / Chat", use: "Thinking / working" },
  success: { file: "clue-love", w: 364, h: 327, label: "Success", use: "Found / done" },
  "no-results": { file: "clue-question", w: 342, h: 348, label: "No results", use: "No matches (yet)" },
  "not-found": { file: "clue-box", w: 370, h: 330, label: "Page not found", use: "404" },
  loading: { file: "clue-loading", w: 375, h: 333, label: "Loading", use: "Searching / processing" },
  empty: { file: "clue-map", w: 370, h: 323, label: "Empty state", use: "Start a search / get help" },
} as const

export type ClueState = keyof typeof cluePoses

export function Clue({
  state = "hello",
  width = 128,
  alt = "Clue",
  priority,
  className,
}: {
  state?: ClueState
  /** Rendered width in px; height follows the pose's proportions. */
  width?: number
  alt?: string
  priority?: boolean
  className?: string
}) {
  const pose = cluePoses[state]
  return (
    <Image
      src={`/assets/clue/${pose.file}.png`}
      alt={alt}
      width={width}
      height={Math.round((width * pose.h) / pose.w)}
      priority={priority}
      className={cn("h-auto shrink-0", className)}
      style={{ width }}
    />
  )
}
