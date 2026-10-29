import { designById, formatById, LINES, lineById, RANGE, specFor, type LineId, type RangeDesign } from '../data/range'
import { pricePerM2 } from '../data/trade'

// SAMPLE DATA for the dealer portal. Stock by batch and shade, a dealer's
// orders, the sales team and how enquiries are routed to them, the cities
// where the network is thin, and export buyers. Every figure is invented for
// a demo company and steady from one visit to the next; no real business or
// person is named. A manufacturer's portal reads these from its own ERP.

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const pick = <T,>(s: string, list: T[]) => list[hash(s) % list.length]

/* ------------------------------------------------------------------ stock by batch */

export interface Batch {
  code: string
  /** a shade grade from the sorting line: S1 lightest to S4 darkest */
  shade: number
  /** the size grade, mm off nominal */
  caliber: string
  made: string
  /** m² free to order, at Morbi */
  morbi: number
  /** m² at the dealer's nearest depot, ready in two days */
  depot: number
}

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct']

/** the batches of a design in a format: two to four, steady for each pair */
export function batchesOf(d: RangeDesign, format: string): Batch[] {
  const h = hash(`${d.id}|${format}`)
  const n = 2 + (h % 3)
  const f = formatById(format)!
  const big = f.kind === 'slab' || f.kind === 'xxl'
  return Array.from({ length: n }, (_, i) => {
    const k = hash(`${d.id}|${format}|${i}`)
    const morbi = big ? 40 + (k % 9) * 26 : 120 + (k % 13) * 64
    return {
      code: `B26-${String(1000 + (k % 8999)).padStart(4, '0')}`,
      shade: 1 + ((h + i) % 4),
      caliber: pick(`${k}`, ['C1', 'C2', 'C3']),
      made: `${MONTHS[(h + i) % 4]} 2026`,
      morbi: i === n - 1 && h % 5 === 0 ? 0 : morbi,
      depot: i === 0 && h % 3 !== 0 ? Math.round(morbi * 0.25) : 0,
    }
  })
}

/** a shade grade drawn from the design's own swatch, a step lighter or darker */
export function shadeColour(swatch: string, shade: number) {
  const rgb = [1, 3, 5].map((i) => parseInt(swatch.slice(i, i + 2), 16))
  const k = 1.12 - (shade - 1) * 0.08
  return `rgb(${rgb.map((v) => Math.round(Math.min(255, v * k))).join(' ')})`
}

/** what the dealer pays per m², a fifth off the list price */
export const dealerPrice = (d: RangeDesign, format: string, mm: number, finish: Parameters<typeof pricePerM2>[3]) =>
  Math.round(pricePerM2(d, format, mm, finish) * 0.8 * 10) / 10

/** the designs a dealer stocks most, first */
export const STOCKED = RANGE.filter((d) => !d.own)

/* ------------------------------------------------------------------ orders */

export type OrderState = 'Placed' | 'Confirmed' | 'Loaded' | 'On the road' | 'Delivered'
export const ORDER_STEPS: OrderState[] = ['Placed', 'Confirmed', 'Loaded', 'On the road', 'Delivered']

export interface OrderLine {
  design: string
  colourway: string
  format: string
  thickness: number
  finish: RangeDesign['finish']
  batch: string
  shade: number
  packs: number
}

export interface Order {
  no: string
  placed: string
  state: OrderState
  lines: OrderLine[]
  eta: string
}

const line = (id: string, packs: number, i = 0): OrderLine => {
  const d = designById(id)!
  const l = lineById(d.line)
  const format = l.hero
  const b = batchesOf(d, format)[i]
  return {
    design: d.id,
    colourway: d.colourways[0].slug,
    format,
    thickness: l.thicknesses[Math.floor(l.thicknesses.length / 2)],
    finish: d.finish,
    batch: b.code,
    shade: b.shade,
    packs,
  }
}

/** a dealer's orders over the last few weeks */
export const PAST_ORDERS: Order[] = [
  { no: 'ORV-26-04788', placed: '24 Oct', state: 'On the road', eta: 'Due 31 Oct', lines: [line('calacatta', 6), line('statuario', 4, 1)] },
  { no: 'ORV-26-04712', placed: '17 Oct', state: 'Delivered', eta: 'Delivered 23 Oct', lines: [line('trav-bianco', 38), line('argento', 22)] },
  { no: 'ORV-26-04655', placed: '9 Oct', state: 'Delivered', eta: 'Delivered 15 Oct', lines: [line('rovere', 64)] },
  { no: 'ORV-26-04590', placed: '2 Oct', state: 'Delivered', eta: 'Delivered 8 Oct', lines: [line('nero', 5), line('portoro', 3)] },
]

/** the weight and area of an order line, from the catalogue's packing */
export function lineFigures(l: OrderLine) {
  const d = designById(l.design)!
  const s = specFor(d, l.format, l.thickness, l.finish)
  const pieces = l.packs * s.packing.pieces
  return { pieces, m2: pieces * s.area, kg: pieces * s.kgPerPiece, unit: s.packing.unit, perPack: s.packing.pieces, price: dealerPrice(d, l.format, l.thickness, l.finish) }
}

/* ------------------------------------------------------------------ the sales team and routing */

export interface Person {
  id: string
  name: string
  role: string
  covers: string
  tint: string
}

export const TEAM: Person[] = [
  { id: 'priya', name: 'Priya S.', role: 'Dealer sales', covers: 'Maharashtra and Goa', tint: '#e7d9c9' },
  { id: 'karan', name: 'Karan M.', role: 'Dealer sales', covers: 'Gujarat and Rajasthan', tint: '#d9e2d6' },
  { id: 'ananya', name: 'Ananya R.', role: 'Dealer sales', covers: 'The south', tint: '#dcd9e8' },
  { id: 'imran', name: 'Imran K.', role: 'Export desk', covers: 'The Gulf', tint: '#e8dcd2' },
  { id: 'chidi', name: 'Chidi O.', role: 'Export desk', covers: 'Africa', tint: '#d6e4e4' },
  { id: 'lucia', name: 'Lucía P.', role: 'Export desk', covers: 'Latin America', tint: '#ece2cf' },
]

export const personById = (id: string) => TEAM.find((p) => p.id === id)!

/** where an enquiry goes, by what it mentions; the first rule that matches wins */
export const ROUTES: { when: string; words: string[]; to: string }[] = [
  { when: 'Mentions the Gulf', words: ['dubai', 'uae', 'saudi', 'riyadh', 'jeddah', 'doha', 'qatar', 'oman', 'muscat', 'kuwait', 'bahrain'], to: 'imran' },
  { when: 'Mentions Africa', words: ['nigeria', 'lagos', 'kenya', 'nairobi', 'ghana', 'accra', 'tanzania', 'ethiopia', 'south africa', 'johannesburg'], to: 'chidi' },
  { when: 'Mentions Latin America', words: ['mexico', 'chile', 'santiago', 'peru', 'lima', 'colombia', 'bogota', 'brazil', 'argentina'], to: 'lucia' },
  { when: 'From Gujarat or Rajasthan', words: ['ahmedabad', 'surat', 'rajkot', 'vadodara', 'jaipur', 'udaipur', 'jodhpur', 'gujarat', 'rajasthan'], to: 'karan' },
  { when: 'From the south', words: ['bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kochi', 'coimbatore', 'kerala'], to: 'ananya' },
  { when: 'Everyone else in India', words: [], to: 'priya' },
]

/* ------------------------------------------------------------------ where the network is thin */

export interface City {
  city: string
  state: string
  /** new homes and shops started in a year, thousands, sample */
  demand: number
  dealers: number
}

export const CITIES: City[] = [
  { city: 'Nagpur', state: 'Maharashtra', demand: 38, dealers: 1 },
  { city: 'Indore', state: 'Madhya Pradesh', demand: 41, dealers: 2 },
  { city: 'Lucknow', state: 'Uttar Pradesh', demand: 52, dealers: 3 },
  { city: 'Coimbatore', state: 'Tamil Nadu', demand: 29, dealers: 1 },
  { city: 'Bhubaneswar', state: 'Odisha', demand: 24, dealers: 0 },
  { city: 'Kochi', state: 'Kerala', demand: 27, dealers: 2 },
  { city: 'Nashik', state: 'Maharashtra', demand: 22, dealers: 1 },
  { city: 'Guwahati', state: 'Assam', demand: 18, dealers: 0 },
  { city: 'Pune', state: 'Maharashtra', demand: 64, dealers: 7 },
  { city: 'Ahmedabad', state: 'Gujarat', demand: 58, dealers: 9 },
]

/** demand per dealer: the higher it is, the more a new dealer would sell */
export const gapOf = (c: City) => Math.round((c.demand / (c.dealers + 1)) * 10) / 10

export interface Prospect {
  id: string
  who: string
  where: string
  size: string
  carries: string
  kind: 'dealer' | 'importer'
  volume?: string
}

/** prospective dealers in the thinnest cities: described, not named */
export const DEALER_LEADS: Prospect[] = [
  { id: 'd1', who: 'Tile and bath showroom', where: 'Nagpur, Dharampeth', size: '4,000 sq ft, 11 staff', carries: 'Two Morbi brands, no large slabs', kind: 'dealer' },
  { id: 'd2', who: 'Building materials house', where: 'Bhubaneswar, Patia', size: '2 depots, 26 staff', carries: 'Vitrified tiles, sanitaryware', kind: 'dealer' },
  { id: 'd3', who: 'Design-led tile studio', where: 'Indore, Vijay Nagar', size: '2,200 sq ft, 6 staff', carries: 'Imported slabs, no Indian brand', kind: 'dealer' },
  { id: 'd4', who: 'Tile and stone dealer', where: 'Guwahati, GS Road', size: '3,100 sq ft, 9 staff', carries: 'Granite, local tiles', kind: 'dealer' },
  { id: 'd5', who: 'Interiors supply store', where: 'Coimbatore, RS Puram', size: '5,500 sq ft, 18 staff', carries: 'Tiles, wood floors, hardware', kind: 'dealer' },
  { id: 'd6', who: 'Showroom group, three branches', where: 'Lucknow, Gomti Nagar', size: '3 showrooms, 40 staff', carries: 'Four brands, small formats', kind: 'dealer' },
]

/** export buyers: described by what they buy, not named */
export const IMPORTERS: Prospect[] = [
  { id: 'i1', who: 'Tile importer and distributor', where: 'Lagos, Nigeria', size: '14 branches', carries: 'Porcelain 600 × 1200, polished', kind: 'importer', volume: '40 containers a year' },
  { id: 'i2', who: 'Project supplier, hotels', where: 'Riyadh, Saudi Arabia', size: 'Fit-out contractor', carries: 'Large slabs, bookmatched', kind: 'importer', volume: '18 containers a year' },
  { id: 'i3', who: 'Wholesaler, East Africa', where: 'Nairobi, Kenya', size: 'Warehouse and 6 resellers', carries: 'Matt floor tiles, outdoor', kind: 'importer', volume: '26 containers a year' },
  { id: 'i4', who: 'Retail chain, home improvement', where: 'Santiago, Chile', size: '22 stores', carries: 'Wood-look planks, 20 mm outdoor', kind: 'importer', volume: '30 containers a year' },
  { id: 'i5', who: 'Stone and tile importer', where: 'Dubai, UAE', size: 'Showroom and depot', carries: 'Onyx looks, kitchen slabs', kind: 'importer', volume: '22 containers a year' },
  { id: 'i6', who: 'Distributor, Andean region', where: 'Lima, Peru', size: '3 cities', carries: 'Porcelain floors, 60 × 60', kind: 'importer', volume: '15 containers a year' },
]

export const STAGES = ['New', 'Contacted', 'Samples sent', 'First order'] as const
export type Stage = (typeof STAGES)[number]

/* ------------------------------------------------------------------ marketing seasons */

export interface Season {
  id: string
  name: string
  when: string
  headline: string
  line: LineId
  designs: string[]
  rooms: string[]
}

export const SEASONS: Season[] = [
  {
    id: 'diwali',
    name: 'Diwali 2026',
    when: 'Posts from 20 October',
    headline: 'Light it up in stone.',
    line: 'maesta',
    designs: ['calacatta', 'portoro', 'statuario', 'lasa', 'ambra', 'nero'],
    rooms: ['maesta-lasa-hall', 'maesta-portoro-dining', 'maesta-calacatta-living'],
  },
  {
    id: 'monsoon',
    name: 'Monsoon 2026',
    when: 'Posts from 15 June',
    headline: 'Floors that grip when wet.',
    line: 'terme',
    designs: ['trav-bianco', 'argento', 'celeste', 'crema', 'onice-perla', 'ivory'],
    rooms: ['terme-bianco-shower', 'terme-celeste-bath', 'terme-argento-steam'],
  },
  {
    id: 'summer',
    name: 'Summer outdoors',
    when: 'Posts from 1 March',
    headline: 'Twenty millimetres for the sun.',
    line: 'aperto',
    designs: ['trav-oro', 'travertino', 'basalto', 'sabbia', 'ardesia', 'lavato'],
    rooms: ['aperto-travertino-pool', 'aperto-oro-courtyard', 'aperto-sabbia-roof'],
  },
]

export const LINE_COUNT = LINES.length
