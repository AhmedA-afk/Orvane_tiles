// SAMPLE DATA. Orvane's branded technologies: illustrative, each shown with
// the "technology" demo note, to let a manufacturer see how its own would be
// presented. The names were checked against existing tile lines (2026-10-28);
// "Continuum", "Monolith", "Atelier" and others were taken.

export type TechId = 'specchio' | 'presa' | 'puro' | 'vena' | 'corpo' | 'ombra'

export interface Technology {
  id: TechId
  name: string
  /** what it does, in a few words */
  kind: string
  claim: string
  detail: string
}

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'specchio',
    name: 'Specchio',
    kind: 'Mirror polish',
    claim: 'Polished until a reflection reads clean across the slab.',
    detail: 'A ten-stage diamond polish to about 95 gloss units, then a nano-seal so the shine keeps its depth.',
  },
  {
    id: 'presa',
    name: 'Presa',
    kind: 'Grip that looks like satin',
    claim: 'Slip-safe when wet, smooth to the eye and the hand.',
    detail: 'A micro-textured glaze rated R11 on the ramp test, with none of the grit of an outdoor finish.',
  },
  {
    id: 'puro',
    name: 'Puro',
    kind: 'Antimicrobial glaze',
    claim: 'A surface that keeps kitchens and bathrooms hygienic.',
    detail: 'Silver ions fired into the glaze slow the growth of bacteria on the surface, for the life of the tile.',
  },
  {
    id: 'vena',
    name: 'Vena',
    kind: 'Continuous vein',
    claim: 'Veins that run unbroken from one slab to the next.',
    detail:
      'Every face is printed in sequence, so a wall of four slabs reads as one stone, or folds open into a bookmatch.',
  },
  {
    id: 'corpo',
    name: 'Corpo',
    kind: 'Through-body colour',
    claim: 'Stone all the way through.',
    detail: 'Colour and vein run through the whole body, so an edge, a chip or a mitred corner shows stone, not biscuit.',
  },
  {
    id: 'ombra',
    name: 'Ombra',
    kind: 'Cool outdoor surface',
    claim: 'Cooler underfoot in full sun.',
    detail: 'A light-reflecting glaze keeps terraces and pool decks comfortable to walk on barefoot through the afternoon.',
  },
]

export const techById = (id: TechId) => TECHNOLOGIES.find((t) => t.id === id)!
