import type { TechId } from './technologies'

// SAMPLE DATA. The finishes. Each one is physics, not a filter: `look` sets
// the material the 3D surface is drawn with, so polished really mirrors the
// room and carved really catches a raking light.

export type FinishId = 'specchio' | 'glossy' | 'satin' | 'matt' | 'carving' | 'pelle' | 'presa' | 'grip'

export interface FinishLook {
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  /** how strongly the design's relief map lights up (0 for flat) */
  relief: number
}

export interface FinishSpec {
  id: FinishId
  name: string
  /** ramp-test slip rating (DIN 51130) */
  slip: 'R9' | 'R10' | 'R11' | 'R12'
  /** gloss units at 60° */
  gloss: number
  note: string
  look: FinishLook
  tech?: TechId
}

export const FINISHES: FinishSpec[] = [
  {
    id: 'specchio',
    name: 'Specchio',
    slip: 'R9',
    gloss: 95,
    note: 'A mirror polish. Reflections run clean across it.',
    look: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.015, relief: 0 },
    tech: 'specchio',
  },
  {
    id: 'glossy',
    name: 'Glossy',
    slip: 'R9',
    gloss: 85,
    note: 'Polished to a bright, deep shine.',
    look: { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, relief: 0 },
  },
  {
    id: 'satin',
    name: 'Satin',
    slip: 'R10',
    gloss: 30,
    note: 'A soft sheen, like honed stone.',
    look: { roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.32, relief: 0 },
  },
  {
    id: 'matt',
    name: 'Matt',
    slip: 'R10',
    gloss: 8,
    note: 'No shine at all; the stone reads as it is.',
    look: { roughness: 0.66, clearcoat: 0, clearcoatRoughness: 0, relief: 0.1 },
  },
  {
    id: 'carving',
    name: 'Carving',
    slip: 'R11',
    gloss: 12,
    note: 'A low relief that follows the vein.',
    look: { roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.4, relief: 1.2 },
  },
  {
    id: 'pelle',
    name: 'Pelle',
    slip: 'R10',
    gloss: 18,
    note: 'Brushed like leathered stone, warm to the touch.',
    look: { roughness: 0.52, clearcoat: 0.2, clearcoatRoughness: 0.5, relief: 0.55 },
  },
  {
    id: 'presa',
    name: 'Presa',
    slip: 'R11',
    gloss: 25,
    note: 'Looks like satin, grips like stone when wet.',
    look: { roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.45, relief: 0.3 },
    tech: 'presa',
  },
  {
    id: 'grip',
    name: 'Grip',
    slip: 'R12',
    gloss: 4,
    note: 'A textured outdoor surface for rain, pools and ramps.',
    look: { roughness: 0.86, clearcoat: 0, clearcoatRoughness: 0, relief: 0.9 },
  },
]

export const finishById = (id: FinishId) => FINISHES.find((x) => x.id === id)!

/** the three finishes the first version of the site knew, mapped onto the range */
export const LEGACY_FINISH: Record<'Glossy' | 'Matt' | 'Carving', FinishId> = {
  Glossy: 'glossy',
  Matt: 'matt',
  Carving: 'carving',
}
