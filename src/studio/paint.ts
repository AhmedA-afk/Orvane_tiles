import { designById, formatById } from '../data/range'
import { drawPattern, GROUT, groutFor } from '../three/pattern'
import { faceOf } from '../three/surface'
import type { Lay } from './state'

// Painting a laid surface onto a plain canvas, without three.js: for the photo
// tool, which lays it in perspective over a picture, and for AR, which hands
// it to the phone. The same pattern code lays the Studio's rooms.

const images = new Map<string, Promise<HTMLImageElement>>()

export function loadImage(src: string) {
  let p = images.get(src)
  if (!p) {
    p = new Promise((ok, fail) => {
      const i = new Image()
      i.decoding = 'async'
      i.onload = () => ok(i)
      i.onerror = fail
      i.src = src
    })
    images.set(src, p)
  }
  return p
}

/** a surface `size` metres across, laid in `lay` at `ppm` pixels a metre, pieces' long side along x */
export async function paintLay(lay: Lay, size: [number, number], ppm: number) {
  const d = designById(lay.design)!
  const cw = d.colourways.find((c) => c.slug === lay.colourway) ?? d.colourways[0]
  const f = formatById(lay.format)!
  const img = await loadImage(faceOf(d, cw).map)
  const k = Math.min(ppm, 4096 / Math.max(...size))
  const c = document.createElement('canvas')
  c.width = Math.max(16, Math.round(size[0] * k))
  c.height = Math.max(16, Math.round(size[1] * k))
  const g = c.getContext('2d')!
  g.fillStyle = GROUT[groutFor(cw.family)]
  g.fillRect(0, 0, c.width, c.height)
  drawPattern(g, img, d, f, lay.pattern, Math.max(1.4, (2 / 1000) * k * 1.6), k, Math.max(c.width, c.height))
  return c
}

/* ------------------------------------------------------------------ perspective */

type P = [number, number]

/** the projective map from the unit square to a quad (far left, far right, near right, near left) */
export function homography(q: [P, P, P, P]) {
  const src: P[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i]
    const [x, y] = q[i]
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x])
    b.push(x)
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y])
    b.push(y)
  }
  // Gaussian elimination with partial pivoting
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    ;[b[c], b[p]] = [b[p], b[c]]
    for (let r = c + 1; r < 8; r++) {
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  const h = new Array(8).fill(0)
  for (let r = 7; r >= 0; r--) {
    let s = b[r]
    for (let k = r + 1; k < 8; k++) s -= A[r][k] * h[k]
    h[r] = s / A[r][r]
  }
  // the third value is the depth term: at or below zero the point lies beyond the horizon
  return (u: number, v: number): [number, number, number] => {
    const w = h[6] * u + h[7] * v + 1
    return [(h[0] * u + h[1] * v + h[2]) / w, (h[3] * u + h[4] * v + h[5]) / w, w]
  }
}

/** one triangle of the texture, mapped affinely onto the screen, grown by half a pixel so no seams show */
function triangle(g: CanvasRenderingContext2D, img: CanvasImageSource, p: [P, P, P], t: [P, P, P]) {
  const cx = (p[0][0] + p[1][0] + p[2][0]) / 3
  const cy = (p[0][1] + p[1][1] + p[2][1]) / 3
  const grow = (q: P): P => {
    const dx = q[0] - cx
    const dy = q[1] - cy
    const l = Math.hypot(dx, dy) || 1
    return [q[0] + (dx / l) * 0.6, q[1] + (dy / l) * 0.6]
  }
  const [[x0, y0], [x1, y1], [x2, y2]] = p
  const [[u0, v0], [u1, v1], [u2, v2]] = t
  const den = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0)
  if (!den) return
  const a = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / den
  const b = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / den
  const c = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / den
  const d = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / den
  const e = x0 - a * u0 - c * v0
  const f = y0 - b * u0 - d * v0
  const [g0, g1, g2] = p.map(grow)
  g.save()
  g.beginPath()
  g.moveTo(...g0)
  g.lineTo(...g1)
  g.lineTo(...g2)
  g.closePath()
  g.clip()
  g.transform(a, b, c, d, e, f)
  g.drawImage(img, 0, 0)
  g.restore()
}

/**
 * Draws `tex` on the plane the quad marks, in perspective: the quad is the
 * unit square of the plane, and the texture covers `u` × `v` of it, so the
 * stone carries on past the marked rectangle, out to the sides and away
 * towards the horizon.
 */
export function drawPlane(g: CanvasRenderingContext2D, tex: HTMLCanvasElement, quad: [P, P, P, P], u: [number, number], v: [number, number], n: number) {
  const H = homography(quad)
  const W = tex.width
  const T = tex.height
  const nu = Math.round(n * 1.6)
  const nv = n
  const at = (i: number, j: number) => {
    const uu = u[0] + ((u[1] - u[0]) * i) / nu
    const vv = v[0] + ((v[1] - v[0]) * j) / nv
    const [x, y, w] = H(uu, vv)
    return { p: [x, y] as P, t: [(i / nu) * W, (j / nv) * T] as P, w }
  }
  // the depth term falls towards the camera; cells much nearer than the marked rectangle's near edge
  // (or behind the camera) would blow up, so they are left out
  const wq = Math.min(H(0, 1)[2], H(1, 1)[2], H(0, 0)[2], H(1, 0)[2])
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = at(i, j)
      const b = at(i + 1, j)
      const c = at(i + 1, j + 1)
      const d = at(i, j + 1)
      if (Math.min(a.w, b.w, c.w, d.w) < wq * 0.4) continue
      triangle(g, tex, [a.p, b.p, c.p], [a.t, b.t, c.t])
      triangle(g, tex, [a.p, c.p, d.p], [a.t, c.t, d.t])
    }
}
