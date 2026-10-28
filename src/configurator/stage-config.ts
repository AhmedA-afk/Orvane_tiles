// The stage's options, kept apart from the 3D module so pages can name them
// without pulling three.js into their own bundle.

export type View = 'slab' | 'scale' | 'pair' | 'laid' | 'compare'
export type LightId = 'day' | 'evening' | 'showroom'
export type Pattern = 'straight' | 'offset' | 'herringbone' | 'chevron' | 'bookmatch'
export interface Grout {
  tone: 'light' | 'mid' | 'dark'
  mm: number
}

/** the studio for each light, and the colour behind the canvas */
export const LIGHTS: Record<LightId, { dark: number; key: number; warm: number; bg: string }> = {
  day: { dark: 0, key: -0.4, warm: 0, bg: '#e8e8e4' },
  evening: { dark: 0.55, key: 0.75, warm: 1, bg: '#2b2620' },
  showroom: { dark: 0.86, key: -0.15, warm: 0.15, bg: '#121213' },
}
