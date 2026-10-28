import type { FinishId } from './finishes'
import type { TechId } from './technologies'

// SAMPLE DATA. Orvane's eight lines, each a brand of its own with its formats,
// thicknesses, finishes and technologies. A design belongs to one line and is
// offered in that line's ranges. Names were checked against existing tile
// lines (2026-10-28).

export type LineId = 'maesta' | 'gemelli' | 'velo' | 'cucina' | 'terme' | 'aperto' | 'legno' | 'tattile'

export type Application =
  | 'Floor'
  | 'Wall'
  | 'Feature wall'
  | 'Facade'
  | 'Countertop'
  | 'Island'
  | 'Splashback'
  | 'Vanity'
  | 'Shower'
  | 'Furniture'
  | 'Door'
  | 'Stairs'
  | 'Terrace'
  | 'Pool'
  | 'Driveway'

export interface Line {
  id: LineId
  name: string
  /** what the line is, in two or three words */
  kind: string
  tagline: string
  story: string
  formats: string[]
  /** the format its cards and portraits show */
  hero: string
  /** the design its page leads with */
  feature: string
  thicknesses: number[]
  finishes: FinishId[]
  techs: TechId[]
  applications: Application[]
}

export const LINES: Line[] = [
  {
    id: 'maesta',
    name: 'Maestà',
    kind: 'The largest slabs',
    tagline: 'One stone, floor to ceiling.',
    story:
      'Slabs up to 1800 × 3600 mm, so a wall is a single surface and a floor has almost no joints. Pressed in 6, 12 and 20 mm, with veins that carry on from one slab to the next.',
    formats: ['1200x2400', '1200x2800', '1600x3200', '1800x3600'],
    hero: '1600x3200',
    feature: 'portoro',
    thicknesses: [6, 12, 20],
    finishes: ['specchio', 'glossy', 'satin', 'matt'],
    techs: ['specchio', 'vena', 'corpo'],
    applications: ['Floor', 'Wall', 'Feature wall', 'Island', 'Facade'],
  },
  {
    id: 'gemelli',
    name: 'Gemelli',
    kind: 'Bookmatched and rare',
    tagline: 'Stones that come in pairs.',
    story:
      'Onyx, rare marbles and coloured stones, printed in sequence and sold as matched sets of two or four, so the veins open across a wall like a book.',
    formats: ['1200x2400', '1200x2800', '1600x3200'],
    hero: '1600x3200',
    feature: 'pavone',
    thicknesses: [6, 12],
    finishes: ['specchio', 'glossy', 'satin'],
    techs: ['vena', 'specchio'],
    applications: ['Feature wall', 'Floor', 'Vanity', 'Furniture', 'Island'],
  },
  {
    id: 'velo',
    name: 'Velo',
    kind: 'Ultra-thin panels',
    tagline: 'Three and a half millimetres of stone.',
    story:
      'Large, light panels in 3.5 and 6 mm for walls, doors and furniture, and for laying straight over an old floor without breaking it up.',
    formats: ['1000x3000', '1200x2400', '1600x3200'],
    hero: '1200x2400',
    feature: 'armani',
    thicknesses: [3.5, 6],
    finishes: ['satin', 'matt', 'glossy'],
    techs: ['corpo'],
    applications: ['Wall', 'Furniture', 'Door', 'Floor'],
  },
  {
    id: 'cucina',
    name: 'Cucina',
    kind: 'Kitchen surfaces',
    tagline: 'Cut it, mitre it, cook on it.',
    story:
      'Full-body slabs in 12 and 20 mm for counters, islands and splashbacks. Mitred edges read as solid stone, sinks are cut in, and a hot pan leaves no mark.',
    formats: ['1600x3200', '1800x3600'],
    hero: '1600x3200',
    feature: 'azul',
    thicknesses: [12, 20],
    finishes: ['glossy', 'satin', 'matt', 'pelle'],
    techs: ['corpo', 'puro'],
    applications: ['Countertop', 'Island', 'Splashback', 'Furniture'],
  },
  {
    id: 'terme',
    name: 'Terme',
    kind: 'Bath and spa',
    tagline: 'Calm to look at, safe underfoot.',
    story:
      'Soft stones for wet rooms: floors that grip when wet yet look like satin, walls in 6 mm panels, and shower trays and vanity tops in the same stone.',
    formats: ['300x600', '600x1200', '800x1600', '1200x2400'],
    hero: '1200x2400',
    feature: 'celeste',
    thicknesses: [6, 9],
    finishes: ['satin', 'presa', 'matt', 'glossy'],
    techs: ['presa', 'puro'],
    applications: ['Shower', 'Floor', 'Wall', 'Vanity', 'Pool'],
  },
  {
    id: 'aperto',
    name: 'Aperto',
    kind: 'Outdoor and pool',
    tagline: 'Twenty millimetres for sun, rain and frost.',
    story:
      'Porcelain 20 mm thick for terraces, pool edges, gardens and drives: laid on grass, gravel or pedestals, frost-proof, and cooler underfoot in summer.',
    formats: ['600x600', '800x800', '600x1200', '1200x1200'],
    hero: '600x1200',
    feature: 'trav-oro',
    thicknesses: [20],
    finishes: ['grip', 'carving', 'matt'],
    techs: ['ombra', 'corpo'],
    applications: ['Terrace', 'Pool', 'Driveway', 'Stairs', 'Facade'],
  },
  {
    id: 'legno',
    name: 'Legno',
    kind: 'Wood in porcelain',
    tagline: 'Planks that never warp.',
    story:
      'Oak, walnut, ash and teak in porcelain planks up to 300 × 2400 mm, laid straight, in herringbone or in chevron, indoors or out.',
    formats: ['200x1200', '200x1600', '300x1800', '300x2400'],
    hero: '300x1800',
    feature: 'canaletto',
    thicknesses: [9, 20],
    finishes: ['matt', 'satin', 'carving'],
    techs: ['presa'],
    applications: ['Floor', 'Wall', 'Stairs', 'Terrace'],
  },
  {
    id: 'tattile',
    name: 'Tattile',
    kind: 'Texture, terrazzo and metal',
    tagline: 'Surfaces you want to touch.',
    story:
      'Terrazzo, concrete and oxidised metals, with relief you can feel: carved, brushed and leathered finishes for walls and floors that catch the light.',
    formats: ['600x600', '600x1200', '1200x1200', '1200x2400'],
    hero: '1200x2400',
    feature: 'tz-laguna',
    thicknesses: [9, 12],
    finishes: ['matt', 'carving', 'satin', 'pelle'],
    techs: ['corpo'],
    applications: ['Wall', 'Floor', 'Facade', 'Feature wall', 'Furniture'],
  },
]

export const lineById = (id: LineId) => LINES.find((x) => x.id === id)!
