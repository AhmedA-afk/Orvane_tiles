import { useEffect, useState } from 'react'

// A small shared store kept in localStorage: whoever uses it re-renders when
// it changes. For state a visitor builds up on one device (a project, a
// dealer's shop, a cart), where a server would keep it in a real product.

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...(fallback as object), ...(JSON.parse(raw) as object) } as T) : fallback
  } catch {
    return fallback
  }
}

export function store<T>(key: string, fallback: T) {
  let value = Array.isArray(fallback) ? (readList(key, fallback) as T) : read(key, fallback)
  const subs = new Set<() => void>()
  const set = (next: T) => {
    value = next
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // private browsing: the change lives until the page closes
    }
    subs.forEach((f) => f())
  }
  const use = () => {
    const [, tick] = useState(0)
    useEffect(() => {
      const on = () => tick((n) => n + 1)
      subs.add(on)
      return () => void subs.delete(on)
    }, [])
    return [value, set] as const
  }
  return { use, get: () => value, set }
}

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : fallback
  } catch {
    return fallback
  }
}
