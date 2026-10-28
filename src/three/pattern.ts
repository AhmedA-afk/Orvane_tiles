import type { ColourFamily, Format, RangeDesign } from '../data/range'
import type { Grout, Pattern } from '../configurator/stage-config'
import { windowFor } from './surface'

// Laying a surface: a floor or a wall drawn piece by piece onto a canvas at
// true scale, each piece a different window of the stone (as the faces in a
// crate differ), in a straight, offset, herringbone or chevron pattern, with
// the grout showing between. The configurator's floor and the Studio's rooms
// both draw with it.

/** the grout's colour for each tone */
export const GROUT: Record<Grout['tone'], string> = { light: '#d9d6cf', mid: '#8f8b84', dark: '#2e2c2a' }

/** the grout follows the stone: dark joints for dark stones, pale for pale ones */
export function groutFor(family: ColourFamily): Grout['tone'] {
  return ['Black', 'Brown', 'Blue', 'Green', 'Red', 'Copper'].includes(family) ? 'dark' : family === 'Grey' || family === 'Taupe' ? 'mid' : 'light'
}

/** draws one piece: a window of the stone, rotated and placed, inside the joint */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  d: RangeDesign,
  f: Format,
  pattern: Pattern,
  joint: number,
  ppm: number,
  px: number,
) {
  // a piece laid long side across: length L along x, width S along y, in canvas px
  const L = (f.h / 1000) * ppm
  const S = (f.w / 1000) * ppm
  let i = 0
  // a bookmatch lays one face again and again, every other piece turned over
  const book = pattern === 'bookmatch'
  const piece = (x: number, y: number, rot: number, len = L, wid = S, flip = false) => {
    const win = windowFor(d, f, book ? 0 : i++ % Math.max(1, d.faces)).uv
    const sx = win.offset[0] * img.width
    const sy = (1 - win.offset[1] - win.repeat[1]) * img.height
    const sw = win.repeat[0] * img.width
    const sh = win.repeat[1] * img.height
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    // the stone's long side runs along the piece's length
    ctx.rotate(Math.PI / 2)
    if (flip) ctx.scale(-1, 1)
    ctx.drawImage(img, sx, sy, sw, sh, -wid / 2 + joint / 2, -len / 2 + joint / 2, wid - joint, len - joint)
    ctx.restore()
  }
  const n = Math.ceil(px / Math.min(S, L)) + 4
  if (pattern === 'straight' || pattern === 'offset' || book) {
    for (let r = -1; r < Math.ceil(px / S) + 1; r++) {
      const shift = pattern === 'offset' && r % 2 ? L / 2 : 0
      for (let c = -1; c < Math.ceil(px / L) + 2; c++) piece(c * L + L / 2 - shift, r * S + S / 2, 0, L, S, book && ((r % 2) + 2) % 2 === 1)
    }
    return
  }
  ctx.save()
  ctx.translate(px / 2, px / 2)
  if (pattern === 'herringbone') {
    // two families of pieces on the lattice (S, S) and (L, -L): one lies along x, one along y
    ctx.rotate(Math.PI / 4)
    for (let a = -n; a < n; a++)
      for (let b = -n / 2; b < n / 2; b++) {
        const ox = a * S + b * L
        const oy = a * S - b * L
        if (Math.abs(ox) > px * 1.2 || Math.abs(oy) > px * 1.2) continue
        piece(ox + L / 2, oy + S / 2, 0)
        piece(ox + L + S / 2, oy + S - L / 2, Math.PI / 2)
      }
  } else {
    // chevron: columns of pieces at ±45°, each clipped to its column so the ends meet in a point
    const colW = L * Math.SQRT1_2
    const step = S * Math.SQRT2
    for (let c = -Math.ceil(px / colW); c < Math.ceil(px / colW); c++) {
      const x0 = c * colW
      ctx.save()
      ctx.beginPath()
      ctx.rect(x0, -px, colW, px * 2)
      ctx.clip()
      const rot = c % 2 ? Math.PI / 4 : -Math.PI / 4
      for (let r = -Math.ceil(px / step) - 2; r < Math.ceil(px / step) + 2; r++) piece(x0 + colW / 2, r * step, rot)
      ctx.restore()
    }
  }
  ctx.restore()
}
