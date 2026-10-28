import { designById, formatById, lineById, type FinishId, type LineId, type RangeDesign } from './range'

// SAMPLE DATA. What a dealer sees and a visitor does not: an indicative price
// per square metre, FOB Mundra, for any configuration; whether a design is in
// stock; how long it takes; the least that can be ordered. The prices follow
// from the line, the thickness, the format and the finish, so none is typed
// in for a single design. A manufacturer replaces these with its own.

/** USD per m², FOB Mundra, for each line in its hero format and middle thickness */
const BASE: Record<LineId, number> = {
  maesta: 38,
  gemelli: 52,
  velo: 34,
  cucina: 46,
  terme: 24,
  aperto: 22,
  legno: 19,
  tattile: 26,
}

const FINISH: Partial<Record<FinishId, number>> = { specchio: 1.08, carving: 1.05, pelle: 1.05, presa: 1.03, grip: 1.03 }

export function pricePerM2(d: RangeDesign, format: string, mm: number, finish: FinishId) {
  const line = lineById(d.line)
  const mid = line.thicknesses[Math.floor(line.thicknesses.length / 2)]
  const f = formatById(format)!
  const size = f.kind === 'xxl' ? 1.15 : f.kind === 'slab' ? 1.05 : f.kind === 'plank' ? 1 : 0.92
  return Math.round(BASE[d.line] * (mm / mid) ** 0.7 * size * (FINISH[finish] ?? 1) * 10) / 10
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** in stock, a fortnight away, or made to order: steady for a design, not random on each look */
export function stockOf(id: string) {
  const d = designById(id)
  if (d?.own) return { label: 'Not yet in production', weeks: null }
  const h = hash(id) % 20
  if (h < 12) return { label: 'In stock', weeks: 0 }
  if (h < 17) return { label: 'Ships in 2 weeks', weeks: 2 }
  return { label: 'Made to order, 4 to 5 weeks', weeks: 5 }
}

/** the least a dealer can order of a design in a format */
export function moqOf(format: string) {
  const f = formatById(format)!
  return f.kind === 'slab' || f.kind === 'xxl' ? '1 crate' : '50 m²'
}

export const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0, minimumFractionDigits: n < 100 ? 2 : 0 })}`

/** "1 crate", "40 boxes" */
export const packs = (n: number, unit: 'box' | 'crate') => `${n} ${unit === 'box' ? (n === 1 ? 'box' : 'boxes') : n === 1 ? 'crate' : 'crates'}`
