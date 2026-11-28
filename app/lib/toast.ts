"use client"

import { useSyncExternalStore } from "react"

type Toast = { id: number; text: string }

let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Short message at the bottom of the screen (prototype `toast`). */
export function toast(text: string) {
  current = { id: Date.now(), text }
  emit()
  clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    emit()
  }, 2600)
}

export function useToast() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null
  )
}
