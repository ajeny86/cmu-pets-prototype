import type { Metadata } from "next"

import { Screen } from "@/components/buddy/screen"
import { Chat } from "./chat"

export const metadata: Metadata = { title: "Chat with Clue" }

/* 04 · Chat with Clue (Figma 461:859) */
export default function ChatPage() {
  return (
    <Screen tabBar={false}>
      <Chat />
    </Screen>
  )
}
