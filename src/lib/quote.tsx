import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { designById, lineById, type FinishId, type RangeDesign } from '../data/range'

// The sample box: up to six configured samples, each a design in a colourway,
// format, thickness and finish, exactly as chosen. It survives a reload (in
// this browser only) and opens with four designs, so the demo never starts empty.

export interface Sample {
  key: string
  design: string
  colourway: string
  format: string
  thickness: number
  finish: FinishId
}

export type SampleConfig = Omit<Sample, 'key'>

export const MAX_SAMPLES = 6
const STORE = 'orvane-samples'

export const sampleKey = (s: SampleConfig) => [s.design, s.colourway, s.format, s.thickness, s.finish].join('|')

/** a design as it is first shown: its first colourway, its line's hero format and middle thickness, its own finish */
export function defaultConfig(d: RangeDesign): SampleConfig {
  const line = lineById(d.line)
  return {
    design: d.id,
    colourway: d.colourways[0].slug,
    format: line.hero,
    thickness: line.thicknesses[Math.floor(line.thicknesses.length / 2)],
    finish: d.finish,
  }
}

const withKey = (c: SampleConfig): Sample => ({ ...c, key: sampleKey(c) })
const STARTERS = ['statuario', 'nero', 'onice', 'travertino'].map((id) => withKey(defaultConfig(designById(id)!)))

function load(): Sample[] {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) return STARTERS
    const list = (JSON.parse(raw) as SampleConfig[]).filter((c) => designById(c.design)).map(withKey)
    return list.slice(0, MAX_SAMPLES)
  } catch {
    return STARTERS
  }
}

interface QuoteState {
  items: Sample[]
  full: boolean
  /** any sample of this design is in the box */
  has(design: string): boolean
  hasExact(c: SampleConfig): boolean
  add(c: SampleConfig): void
  remove(key: string): void
  /** add a design in its first configuration, or take every sample of it out */
  toggle(design: string): void
}

const QuoteContext = createContext<QuoteState | null>(null)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Sample[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(items.map(({ key: _key, ...c }) => c)))
    } catch {
      // storage can be unavailable (private windows); the box still works for this visit
    }
  }, [items])

  const add = useCallback(
    (c: SampleConfig) =>
      setItems((cur) => (cur.length >= MAX_SAMPLES || cur.some((s) => s.key === sampleKey(c)) ? cur : [...cur, withKey(c)])),
    [],
  )
  const remove = useCallback((key: string) => setItems((cur) => cur.filter((s) => s.key !== key)), [])
  const toggle = useCallback((design: string) => {
    const d = designById(design)
    if (!d) return
    setItems((cur) =>
      cur.some((s) => s.design === design)
        ? cur.filter((s) => s.design !== design)
        : cur.length >= MAX_SAMPLES
          ? cur
          : [...cur, withKey(defaultConfig(d))],
    )
  }, [])

  const value = useMemo<QuoteState>(
    () => ({
      items,
      full: items.length >= MAX_SAMPLES,
      has: (design) => items.some((s) => s.design === design),
      hasExact: (c) => items.some((s) => s.key === sampleKey(c)),
      add,
      remove,
      toggle,
    }),
    [items, add, remove, toggle],
  )
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote must be used inside QuoteProvider')
  return ctx
}
