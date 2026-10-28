import type { DemoTopic } from '../demo.ts'
import data from './designs.json' with { type: 'json' }
import swatches from './swatches.json' with { type: 'json' }
import { FINISHES, finishById, type FinishId } from './finishes.ts'
import { FORMATS, formatById, THICKNESSES, thicknessByMm, type Format } from './formats.ts'
import { LINES, lineById, type LineId } from './lines.ts'
import type { TechId } from './technologies.ts'

// SAMPLE DATA. The range as one queryable catalogue: lines, designs and their
// colourways, the options each design comes in, and the spec of any one
// configuration, computed rather than typed. designs.json is the source;
// swatches.json is written from it by scripts/build-textures.py.

export * from './finishes.ts'
export * from './formats.ts'
export * from './lines.ts'
export * from './technologies.ts'

export type Look = 'marble' | 'onyx' | 'travertine' | 'granite' | 'stone' | 'concrete' | 'terrazzo' | 'wood' | 'metal' | 'solid'

export type ColourFamily =
  | 'White'
  | 'Cream'
  | 'Beige'
  | 'Taupe'
  | 'Grey'
  | 'Black'
  | 'Brown'
  | 'Gold'
  | 'Copper'
  | 'Red'
  | 'Pink'
  | 'Green'
  | 'Blue'
  | 'Multi'

/** the colour filter, in the order a catalogue lists it, each with a swatch */
export const COLOUR_FAMILIES: { id: ColourFamily; swatch: string }[] = [
  { id: 'White', swatch: '#f2f1ed' },
  { id: 'Cream', swatch: '#ebe1cb' },
  { id: 'Beige', swatch: '#d4c2a3' },
  { id: 'Taupe', swatch: '#a99c8c' },
  { id: 'Grey', swatch: '#9b9b99' },
  { id: 'Black', swatch: '#1e1e20' },
  { id: 'Brown', swatch: '#6b4a33' },
  { id: 'Gold', swatch: '#c49a4a' },
  { id: 'Copper', swatch: '#b0603a' },
  { id: 'Red', swatch: '#8e2f2a' },
  { id: 'Pink', swatch: '#d6a8a1' },
  { id: 'Green', swatch: '#4f7a5c' },
  { id: 'Blue', swatch: '#4b6a8f' },
  { id: 'Multi', swatch: 'conic-gradient(#c96a4a, #d9b15a, #5f8f74, #4b6a8f, #c96a4a)' },
]

export interface Colourway {
  slug: string
  name: string
  /** the face, in public/tiles/ */
  file: string
  /** the small face, for swatches and cards */
  sm: string
  /** the mean colour */
  swatch: string
  family: ColourFamily
}

export interface RangeDesign {
  id: string
  name: string
  line: LineId
  /** where the surface comes from, e.g. "ambientCG:Marble001" (CC0) */
  source: string
  look: Look
  /** how many different faces are printed, so slabs in a crate don't repeat */
  faces: number
  /** the finish it is shown in first */
  finish: FinishId
  note: string
  /** one of the first fifteen designs, whose faces predate the range */
  legacy: boolean
  /** has a full-resolution face for close-ups */
  hd: boolean
  /** has a normal map, for relief finishes */
  normal: boolean
  /** width / height of the face texture */
  aspect: number
  colourways: Colourway[]
  /** the area of stone the face shows, in mm, where it is not the usual 1600 × 3200 */
  master?: [number, number]
  /** added by a visitor with the Studio's upload tool, kept on their device only */
  own?: boolean
}

type Manifest = Record<string, { normal: boolean; aspect: number; colourways: { slug: string; name: string; file: string; swatch: string; family: string }[] }>
const MANIFEST = swatches as Manifest
const smOf = (file: string) => file.replace(/\.webp$/, '-sm.webp')

export const RANGE: RangeDesign[] = data.designs.map((d) => {
  const m = MANIFEST[d.id]
  return {
    id: d.id,
    name: d.name,
    line: d.line as LineId,
    source: d.source,
    look: d.look as Look,
    faces: d.faces,
    finish: d.finish as FinishId,
    note: d.note,
    legacy: 'legacy' in d && !!d.legacy,
    hd: 'hd' in d && !!d.hd,
    normal: m?.normal ?? false,
    aspect: m?.aspect ?? 0.5,
    colourways: (m?.colourways ?? []).map((c) => ({ ...c, sm: smOf(c.file), family: c.family as ColourFamily })),
  }
})

export const designById = (id: string) => RANGE.find((d) => d.id === id)

/** a face file's address: the range's live in public/tiles, an uploaded one is a blob of its own */
export const tileUrl = (file: string) => (file.includes(':') || file.startsWith('/') ? file : `/tiles/${file}`)

/** the studio render of a design in a colourway, or, for an uploaded design, its own face */
export const cardUrl = (d: RangeDesign, colourway: string) =>
  d.own ? tileUrl(d.colourways[0].sm) : `/renders/range/${d.id}--${colourway}.jpg`

/** "Calacatta Oro" in its own colourway, "Calacatta Oro, Viola" in another */
export function labelOf(d: RangeDesign, colourway: string) {
  const i = d.colourways.findIndex((c) => c.slug === colourway)
  return i <= 0 ? d.name : `${d.name}, ${d.colourways[i].name}`
}
export const designsIn = (line: LineId) => RANGE.filter((d) => d.line === line)

/** everything a design can be configured in: its line's ranges, and its own colourways */
export function optionsFor(d: RangeDesign) {
  const line = lineById(d.line)
  return {
    formats: line.formats.map((id) => formatById(id)!),
    thicknesses: line.thicknesses.map((mm) => thicknessByMm(mm)!),
    finishes: line.finishes.map((id) => finishById(id)),
    colourways: d.colourways,
  }
}

// ---------------------------------------------------------------- spec

/** porcelain weighs about 2.35 kg per m² for every millimetre of thickness */
const KG_PER_M2_MM = 2.35
/** pieces per A-frame crate for slabs, by thickness */
const CRATE: Record<number, number> = { 3.5: 60, 6: 40, 9: 30, 12: 24, 20: 14 }

export interface Spec {
  format: Format
  thickness: number
  finish: FinishId
  /** m² per piece */
  area: number
  kgPerM2: number
  kgPerPiece: number
  packing: { unit: 'box' | 'crate'; pieces: number; m2: number; kg: number }
  slip: string
  gloss: number
  uses: string[]
  techs: TechId[]
  /** which demo notes this configuration has to carry */
  demo: DemoTopic[]
}

export function specFor(d: RangeDesign, formatId: string, mm: number, finishId: FinishId): Spec {
  const format = formatById(formatId)!
  const finish = finishById(finishId)
  const line = lineById(d.line)
  const area = (format.w * format.h) / 1e6
  const kgPerM2 = mm * KG_PER_M2_MM
  const kgPerPiece = area * kgPerM2
  const slab = format.kind === 'slab' || format.kind === 'xxl'
  // boxes stay under about 32 kg; slabs travel on A-frame crates
  const pieces = slab
    ? Math.max(1, Math.min(CRATE[mm] ?? 20, Math.floor(1800 / kgPerPiece)))
    : Math.max(1, Math.min(16, Math.floor(32 / kgPerPiece)))
  const techs = [...line.techs, ...(finish.tech && !line.techs.includes(finish.tech) ? [finish.tech] : [])]
  return {
    format,
    thickness: mm,
    finish: finishId,
    area,
    kgPerM2,
    kgPerPiece,
    packing: { unit: slab ? 'crate' : 'box', pieces, m2: pieces * area, kg: pieces * kgPerPiece },
    slip: finish.slip,
    gloss: finish.gloss,
    uses: thicknessByMm(mm)?.uses ?? [],
    techs,
    demo: [...(format.demo ? (['sizes'] as DemoTopic[]) : []), ...(techs.length ? (['technology'] as DemoTopic[]) : [])],
  }
}

/** a readable code for one configuration, e.g. OR-MAE-CAL-1632-12-SP-VIO */
export function skuFor(d: RangeDesign, formatId: string, mm: number, finishId: FinishId, colourway: string) {
  const f = formatById(formatId)!
  const short = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase()
  const size = `${Math.round(f.w / 100)}${Math.round(f.h / 100)}`
  return ['OR', short(lineById(d.line).name), short(d.id), size, String(mm).replace('.', ''), short(finishId).slice(0, 2), short(colourway)].join('-')
}

// ---------------------------------------------------------------- checks

/** catalogue consistency, for scripts/check-range.ts and the dev console */
export function checkRange(): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  const families = new Set(COLOUR_FAMILIES.map((c) => c.id))
  for (const d of RANGE) {
    if (ids.has(d.id)) problems.push(`${d.id}: duplicate id`)
    ids.add(d.id)
    const line = LINES.find((l) => l.id === d.line)
    if (!line) problems.push(`${d.id}: no line ${d.line}`)
    else if (!line.finishes.includes(d.finish)) problems.push(`${d.id}: finish ${d.finish} not in ${line.name}`)
    if (!MANIFEST[d.id]) problems.push(`${d.id}: no textures built (run scripts/build-textures.py)`)
    if (!d.colourways.length) problems.push(`${d.id}: no colourways`)
    for (const c of d.colourways) if (!families.has(c.family)) problems.push(`${d.id}/${c.slug}: unknown family ${c.family}`)
  }
  for (const l of LINES) {
    for (const f of l.formats) if (!formatById(f)) problems.push(`${l.id}: unknown format ${f}`)
    for (const mm of l.thicknesses) if (!thicknessByMm(mm)) problems.push(`${l.id}: unknown thickness ${mm}`)
    for (const f of l.finishes) if (!FINISHES.find((x) => x.id === f)) problems.push(`${l.id}: unknown finish ${f}`)
    if (!RANGE.some((d) => d.line === l.id)) problems.push(`${l.id}: no designs`)
  }
  return problems
}

export const COUNTS = {
  lines: LINES.length,
  designs: RANGE.length,
  colourways: RANGE.reduce((n, d) => n + d.colourways.length, 0),
  formats: FORMATS.length,
  thicknesses: THICKNESSES.length,
  finishes: FINISHES.length,
}
