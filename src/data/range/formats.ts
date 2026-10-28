// SAMPLE DATA. Formats and thicknesses for the demo range. A slab's weight
// follows its thickness (porcelain is about 2.35 kg per m² per millimetre),
// and the packing follows from that, so no figure here is typed in by hand.

export type FormatKind = 'tile' | 'plank' | 'slab' | 'xxl'

export interface Format {
  id: string
  /** millimetres, width × height as it stands */
  w: number
  h: number
  kind: FormatKind
  /** a record size shown for the demo; it carries the "sizes" note */
  demo?: boolean
}

const f = (w: number, h: number, kind: FormatKind, demo = false): Format => ({ id: `${w}x${h}`, w, h, kind, demo })

export const FORMATS: Format[] = [
  f(300, 600, 'tile'),
  f(600, 600, 'tile'),
  f(800, 800, 'tile'),
  f(600, 1200, 'tile'),
  f(1200, 1200, 'tile'),
  f(800, 1600, 'tile'),
  f(200, 1200, 'plank'),
  f(200, 1600, 'plank'),
  f(300, 1800, 'plank'),
  f(300, 2400, 'plank'),
  f(1200, 2400, 'slab'),
  f(1200, 2800, 'slab'),
  f(1000, 3000, 'slab'),
  f(1600, 3200, 'slab'),
  f(1800, 3600, 'xxl', true),
]

export const formatById = (id: string) => FORMATS.find((x) => x.id === id)

/** "1600 × 3200" */
export const formatLabel = (x: Format) => `${x.w} × ${x.h}`

export interface Thickness {
  mm: number
  label: string
  /** what the thickness is for, in order of fit */
  uses: string[]
}

export const THICKNESSES: Thickness[] = [
  { mm: 3.5, label: '3.5 mm', uses: ['Walls', 'Furniture', 'Doors', 'Over an old floor'] },
  { mm: 6, label: '6 mm', uses: ['Walls', 'Floors', 'Furniture', 'Shower walls'] },
  { mm: 9, label: '9 mm', uses: ['Floors', 'Walls'] },
  { mm: 12, label: '12 mm', uses: ['Countertops', 'Floors', 'Stairs', 'Vanities'] },
  { mm: 20, label: '20 mm', uses: ['Outdoor', 'Islands', 'Countertops', 'Driveways'] },
]

export const thicknessByMm = (mm: number) => THICKNESSES.find((t) => t.mm === mm)
