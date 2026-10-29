import { drawPlane } from './paint'

// The photo tool's floor, as a function: a photograph, the plane its four
// corners mark, the stone laid on that plane in perspective and carried out
// to the floor's outline, the photograph's light laid back over it. Shared
// by the photo tool and the dealers' showroom visualizer.

export type P = [number, number]
export type Quad = [P, P, P, P]
export interface Stroke {
  mode: 'floor' | 'keep'
  r: number
  pts: P[]
}

/** the sample: an empty room, its floor already marked */
export const SAMPLE = {
  src: '/images/studio/empty-room.jpg',
  quad: [
    [960, 422],
    [1280, 432],
    [1666, 940],
    [48, 940],
  ] as Quad,
  mask: [
    [116, 500],
    [580, 412],
    [1432, 444],
    [1620, 552],
    [1620, 941],
    [116, 941],
  ] as P[],
  size: [2.2, 4.6] as [number, number],
}

// the plane is laid well beyond the marked rectangle, so it reaches the floor's edges
// v runs from far (0) to near (1): it carries on far beyond the rectangle, and only a little nearer
export const U: [number, number] = [-2.5, 3.5]
export const V: [number, number] = [-2.5, 1.6]


/** the photograph in grey, for laying its light over the stone */
export function greyOf(img: HTMLImageElement) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const g = c.getContext('2d')!
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, c.width, c.height)
  for (let i = 0; i < d.data.length; i += 4) {
    const y = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]
    d.data[i] = d.data[i + 1] = d.data[i + 2] = y
  }
  g.putImageData(d, 0, 0)
  return c
}

export interface FloorScene {
  img: HTMLImageElement
  grey: HTMLCanvasElement
  tex: HTMLCanvasElement
  quad: Quad
  mask: P[]
  strokes: Stroke[]
  /** how much of the photograph's light is kept over the stone, 0 to 1 */
  shade: number
}

/** draws the photograph with its floor laid, at `k` times its size, the plane cut into an n-cell grid */
export function composeFloor(target: HTMLCanvasElement, sc: FloorScene, k: number, n: number) {
  const { img, grey, tex, quad, mask, strokes, shade } = sc
  const w = Math.round(img.naturalWidth * k)
  const h = Math.round(img.naturalHeight * k)
  target.width = w
  target.height = h
  const g = target.getContext('2d')!
  g.drawImage(img, 0, 0, w, h)
  const s = (p: P): P => [p[0] * k, p[1] * k]
  // the floor: the plane in perspective, the photo's light over it, cut to the floor's outline
  const layer = document.createElement('canvas')
  layer.width = w
  layer.height = h
  const f = layer.getContext('2d')!
  drawPlane(f, tex, quad.map(s) as Quad, U, V, n)
  f.globalCompositeOperation = 'soft-light'
  f.globalAlpha = shade
  f.drawImage(grey, 0, 0, w, h)
  f.globalAlpha = 1
  const m = document.createElement('canvas')
  m.width = w
  m.height = h
  const mg = m.getContext('2d')!
  mg.fillStyle = '#fff'
  mg.beginPath()
  mask.forEach((p, i) => (i ? mg.lineTo(...s(p)) : mg.moveTo(...s(p))))
  mg.closePath()
  mg.fill()
  mg.lineCap = mg.lineJoin = 'round'
  for (const st of strokes) {
    mg.globalCompositeOperation = st.mode === 'floor' ? 'source-over' : 'destination-out'
    mg.strokeStyle = '#fff'
    mg.lineWidth = st.r * 2 * k
    mg.beginPath()
    st.pts.forEach((p, i) => (i ? mg.lineTo(...s(p)) : mg.moveTo(...s(p))))
    if (st.pts.length === 1) mg.lineTo(s(st.pts[0])[0] + 0.1, s(st.pts[0])[1])
    mg.stroke()
  }
  f.globalCompositeOperation = 'destination-in'
  f.drawImage(m, 0, 0)
  g.drawImage(layer, 0, 0)
}
