import { useSyncExternalStore } from 'react'

// Two flags shared by the preloader and the home page: whether the page behind
// the preloader is ready to be seen, and whether the reveal has happened (so
// the page can play its entrance).

const state = { ready: true, revealed: false }
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export const setPageReady = (ready: boolean) => {
  if (state.ready === ready) return
  state.ready = ready
  emit()
}
export const setRevealed = () => {
  if (state.revealed) return
  state.revealed = true
  emit()
}

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const usePageReady = () => useSyncExternalStore(subscribe, () => state.ready)
export const useRevealed = () => useSyncExternalStore(subscribe, () => state.revealed)
