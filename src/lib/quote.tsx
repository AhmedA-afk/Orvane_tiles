import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface QuoteState {
  items: string[]
  has(id: string): boolean
  toggle(id: string): void
  remove(id: string): void
}

const QuoteContext = createContext<QuoteState | null>(null)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(['calacatta-6012'])

  const toggle = useCallback(
    (id: string) => setItems((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    [],
  )
  const remove = useCallback((id: string) => setItems((cur) => cur.filter((x) => x !== id)), [])

  const value = useMemo(
    () => ({ items, has: (id: string) => items.includes(id), toggle, remove }),
    [items, toggle, remove],
  )
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote must be used inside QuoteProvider')
  return ctx
}
