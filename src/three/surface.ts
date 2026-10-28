import { tileUrl, type Colourway, type Format, type RangeDesign } from '../data/range'
import type { FaceSrc, UvWindow } from './Slab'

// From the catalogue to the 3D surface: which texture a colourway uses, how
// much stone its face texture stands for, and which window of it a piece in a
// given format shows, so veins keep their true scale from a 300 × 600 tile to
// an 1800 × 3600 slab.

/** the face texture (and relief map) of a design in one colourway */
export function faceOf(d: RangeDesign, cw: Colourway, hd = false): FaceSrc {
  const big = hd && d.hd && cw.file === `${d.id}.webp`
  return {
    map: big ? `/tiles/${d.id}-hd.webp` : tileUrl(cw.file),
    normal: d.normal ? `/tiles/${d.id}-n.webp` : undefined,
  }
}

/** the area of stone, in mm, that a design's face texture represents */
export function masterMm(d: RangeDesign): [number, number] {
  if (d.master) return d.master
  if (Math.abs(d.aspect - 0.5) < 0.02) return [1600, 3200]
  if (d.aspect < 0.25) return [300, 1800]
  if (Math.abs(d.aspect - 1) < 0.02) return [1200, 1200]
  return [3200 * d.aspect, 3200]
}

/**
 * The window of the face a piece shows. Face `i` of a crate takes a different
 * window, or for a full slab a mirrored one, as the printed faces differ. A
 * format bigger than the texture scales the window uniformly, never stretching.
 */
export function windowFor(d: RangeDesign, f: Format, i = 0): { uv: UvWindow; flip: [boolean, boolean] } {
  const [mw, mh] = masterMm(d)
  let ru = f.w / mw
  let rv = f.h / mh
  const k = Math.max(1, ru, rv)
  ru /= k
  rv /= k
  const frac = (x: number) => x - Math.floor(x)
  const offset: [number, number] = [(1 - ru) * frac(i * 0.618 + 0.21), (1 - rv) * frac(i * 0.382 + 0.47)]
  const full = ru > 0.95 && rv > 0.95
  return {
    uv: { offset: i === 0 ? [(1 - ru) / 2, (1 - rv) / 2] : offset, repeat: [ru, rv] },
    flip: full ? [i % 2 === 1, Math.floor(i / 2) % 2 === 1] : [false, false],
  }
}

/** a piece's size in metres */
export const metres = (f: Format): [number, number] => [f.w / 1000, f.h / 1000]
