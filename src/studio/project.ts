import { useEffect, useState } from 'react'
import { DEMO } from '../data/demo'
import { designById, finishById, formatById, formatLabel, labelOf, specFor } from '../data/range'
import { WHATSAPP_NUMBER } from '../data/site'
import { packs, pricePerM2, stockOf, usd } from '../data/trade'
import { printSheet, type SheetSection } from '../lib/specSheet'
import type { RoomDef, SurfaceDef } from './rooms'
import { sampleOf, type Kind, type Lay } from './state'

// A project: the rooms a visitor has laid in the Studio, surface by surface,
// added up the way a quote is: each stone's area across the rooms, the pieces
// with a tenth added for cutting, the boxes or crates, the weight, and how
// many 20 ft containers it fills. Kept on this device. In dealer mode it also
// carries prices and prints as a quotation.

export interface ProjectItem {
  key: string
  room: string
  house: string
  surface: string
  kind: Kind
  area: number
  lay: Lay
}

export interface Dealer {
  on: boolean
  showroom: string
  client: string
}

const KEY = 'orvane-project'
const DEALER = 'orvane-dealer'
/** a 20 ft container is full by weight before it is full by volume */
const PAYLOAD_KG = 24000
const WASTE = 1.1

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** a small shared store, kept in localStorage, that re-renders whoever uses it */
function store<T>(key: string, fallback: T) {
  let value = read(key, fallback)
  const subs = new Set<() => void>()
  const set = (next: T) => {
    value = next
    localStorage.setItem(key, JSON.stringify(next))
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

const project = store<ProjectItem[]>(KEY, [])
const dealer = store<Dealer>(DEALER, { on: false, showroom: '', client: '' })

export const useDealer = dealer.use

export function useProject() {
  const [items, set] = project.use()
  return {
    items,
    /** puts every surface of the room in the project, replacing what was there for it */
    addRoom(room: RoomDef, surfaces: SurfaceDef[], lays: Record<string, Lay>) {
      const next = items.filter((i) => !i.key.startsWith(`${room.id}:`))
      for (const s of surfaces) {
        if (designById(lays[s.id].design)?.own) continue
        next.push({
          key: `${room.id}:${s.id}`,
          room: room.name,
          house: room.house,
          surface: s.name,
          kind: s.kind,
          area: s.planes.reduce((a, p) => a + p.size[0] * p.size[1], 0),
          lay: lays[s.id],
        })
      }
      set(next)
    },
    remove: (key: string) => set(items.filter((i) => i.key !== key)),
    clear: () => set([]),
  }
}

/* ------------------------------------------------------------------ adding it up */

export interface Line {
  label: string
  where: string[]
  format: string
  finish: string
  thickness: number
  area: number
  pieces: number
  packs: number
  unit: 'box' | 'crate'
  kg: number
  price: number
  total: number
  stock: string
}

/** the project as order lines: one for each stone in each configuration, wherever it is laid */
export function linesOf(items: ProjectItem[]) {
  const by = new Map<string, { item: ProjectItem; area: number; where: string[] }>()
  for (const i of items) {
    const s = sampleOf(i.lay, i.kind)
    const k = [i.lay.design, i.lay.colourway, i.lay.format, i.lay.finish, s.thickness].join('|')
    const cur = by.get(k)
    const where = `${i.room}, ${i.surface.toLowerCase()}`
    if (cur) {
      cur.area += i.area
      cur.where.push(where)
    } else by.set(k, { item: i, area: i.area, where: [where] })
  }
  const lines: Line[] = [...by.values()].map(({ item, area, where }) => {
    const d = designById(item.lay.design)!
    const s = sampleOf(item.lay, item.kind)
    const spec = specFor(d, item.lay.format, s.thickness, item.lay.finish)
    const pieces = Math.ceil((area / spec.area) * WASTE)
    const packs = Math.ceil(pieces / spec.packing.pieces)
    const price = pricePerM2(d, item.lay.format, s.thickness, item.lay.finish)
    return {
      label: labelOf(d, item.lay.colourway),
      where,
      format: `${formatLabel(formatById(item.lay.format)!)} mm`,
      finish: finishById(item.lay.finish).name,
      thickness: s.thickness,
      area,
      pieces,
      packs,
      unit: spec.packing.unit,
      kg: pieces * spec.kgPerPiece,
      price,
      total: price * pieces * spec.area,
      stock: stockOf(d.id).label,
    }
  })
  const kg = lines.reduce((a, l) => a + l.kg, 0)
  return {
    lines,
    area: lines.reduce((a, l) => a + l.area, 0),
    kg,
    total: lines.reduce((a, l) => a + l.total, 0),
    containers: Math.max(1, Math.ceil(kg / PAYLOAD_KG)),
  }
}

const t = (kg: number) => `${(kg / 1000).toFixed(1)} t`
const m2 = (a: number) => `${a.toFixed(1)} m²`

/** the schedule, or in dealer mode the quotation, as a printable sheet */
export function printProject(items: ProjectItem[], d: Dealer) {
  const p = linesOf(items)
  const sections: SheetSection[] = p.lines.map((l) => ({
    title: l.label,
    rows: [
      ['Where', l.where.join('; ')],
      ['Format', `${l.format}, ${l.thickness} mm, ${l.finish.toLowerCase()}`],
      ['Area', m2(l.area)],
      ['To order', `${l.pieces} pieces in ${packs(l.packs, l.unit)}, a tenth added for cutting`],
      ['Weight', t(l.kg)],
      ...(d.on
        ? ([
            ['Price', `${usd(l.price)} per m², FOB Mundra`],
            ['Line total', usd(l.total)],
            ['Availability', l.stock],
          ] as [string, string][])
        : []),
    ],
  }))
  sections.push({
    title: 'In all',
    rows: [
      ['Area', m2(p.area)],
      ['Weight', t(p.kg)],
      ['Containers', `${p.containers} × 20 ft, by weight`],
      ...(d.on ? ([['Total, FOB Mundra', usd(p.total)]] as [string, string][]) : []),
    ],
  })
  printSheet({
    title: d.on && d.client ? `For ${d.client}` : 'Your project',
    sub: d.on
      ? `Quotation from ${d.showroom || 'your showroom'}, laid in the Orvane Studio. Prices are FOB Mundra and indicative.`
      : `Laid in the Orvane Studio: ${new Set(items.map((i) => i.room)).size} rooms, ${p.lines.length} stones.`,
    sections,
    notes: [DEMO.figures, ...(d.on ? [DEMO.claims] : []), DEMO.company],
    label: d.on ? 'Quotation' : 'Project schedule',
    columns: 1,
  })
}

/** the project as a WhatsApp message to the studio */
export function projectLink(items: ProjectItem[]) {
  const p = linesOf(items)
  const text = [
    'Hello Orvane, I laid this project in the Studio:',
    ...p.lines.map((l) => `• ${l.label}, ${l.format}, ${l.thickness} mm, ${l.finish.toLowerCase()}: ${m2(l.area)} (${l.where.join('; ')})`),
    `In all ${m2(p.area)}, about ${t(p.kg)}. Could you quote it?`,
  ].join('\n')
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
