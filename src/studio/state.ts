import type { Pattern } from '../configurator/stage-config'
import { designById, formatById, lineById, optionsFor, RANGE, type FinishId, type Format, type RangeDesign } from '../data/range'
import type { SampleConfig } from '../lib/quote'
import type { SurfaceDef } from './rooms'

// The Studio's choices, kept apart from three.js so the page can read and
// write them without loading the 3D: which stone is laid on each surface of
// a room, in which format, pattern and finish. They travel in the URL, so a
// room can be shared exactly as it was set.

export type Kind = SurfaceDef['kind']

export interface Lay {
  design: string
  colourway: string
  format: string
  pattern: Pattern
  finish: FinishId
}

export const PATTERN_NAME: Record<Pattern, string> = {
  straight: 'Straight',
  offset: 'Half offset',
  herringbone: 'Herringbone',
  chevron: 'Chevron',
  bookmatch: 'Bookmatch',
}

/** which patterns a format can be laid in: long, narrow pieces take the angled ones on the ground, slabs can be bookmatched */
export function patternsFor(f: Format, kind: Kind): Pattern[] {
  const ratio = Math.max(f.w, f.h) / Math.min(f.w, f.h)
  const out: Pattern[] = ['straight', 'offset']
  if (ratio >= 2 && Math.min(f.w, f.h) <= 600 && (kind === 'floor' || kind === 'outdoor')) out.push('herringbone', 'chevron')
  if (f.kind === 'slab' || f.kind === 'xxl') out.push('bookmatch')
  return out
}

/** a lay for a design that its line actually offers, keeping as much of `prefer` as it can */
export function layFor(d: RangeDesign, kind: Kind, prefer: Partial<Lay> = {}): Lay {
  const o = optionsFor(d)
  const line = lineById(d.line)
  const colourway = d.colourways.find((c) => c.slug === prefer.colourway)?.slug ?? d.colourways[0].slug
  const format = o.formats.find((f) => f.id === prefer.format)?.id ?? line.hero
  const finish = o.finishes.find((f) => f.id === prefer.finish)?.id ?? d.finish
  const pats = patternsFor(formatById(format)!, kind)
  const pattern = prefer.pattern && pats.includes(prefer.pattern) ? prefer.pattern : 'straight'
  return { design: d.id, colourway, format, pattern, finish }
}

/** what a surface is laid in before anyone changes it */
export const startLay = (s: SurfaceDef) => layFor(designById(s.start.design)!, s.kind, s.start)

/** "calacatta.oro.1600x3200.straight.specchio" */
export const encodeLay = (l: Lay) => [l.design, l.colourway, l.format, l.pattern, l.finish].join('.')

export function decodeLay(s: string | null, kind: Kind): Lay | undefined {
  if (!s) return undefined
  const [design, colourway, format, pattern, finish] = s.split('.')
  const d = designById(design)
  return d ? layFor(d, kind, { colourway, format, pattern: pattern as Pattern, finish: finish as FinishId }) : undefined
}

/** the lay as a sample for the box, in the thickness the line uses for that kind of surface */
export function sampleOf(l: Lay, kind: Kind): SampleConfig {
  const mm = lineById(designById(l.design)!.line).thicknesses
  const thickness = kind === 'wall' ? mm[0] : kind === 'outdoor' || kind === 'top' ? mm[mm.length - 1] : mm[Math.floor(mm.length / 2)]
  return { design: l.design, colourway: l.colourway, format: l.format, thickness, finish: l.finish }
}

/** the designs offered for a kind of surface: the outdoors takes the outdoor lines */
export function designsFor(kind: Kind): RangeDesign[] {
  if (kind === 'outdoor') return RANGE.filter((d) => ['aperto', 'legno', 'tattile'].includes(d.line))
  return RANGE
}
