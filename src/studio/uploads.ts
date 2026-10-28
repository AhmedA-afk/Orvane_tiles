import { useEffect, useState } from 'react'
import { COLOUR_FAMILIES, RANGE, type ColourFamily, type LineId, type RangeDesign } from '../data/range'

// Designs a visitor adds themselves: a photograph or scan of a slab, cropped
// to the piece it shows, kept on this device (the pictures in IndexedDB, the
// details in localStorage) and registered into the range at start, so the
// Studio and the photo tool can lay it like any other stone. Nothing is sent
// anywhere. For a manufacturer, this is the moment to see a new design in a
// room before it is printed.

export interface OwnMeta {
  id: string
  name: string
  line: LineId
  /** the piece the picture shows, in mm */
  master: [number, number]
  swatch: string
  family: ColourFamily
  created: number
}

const META = 'orvane-own-designs'
const DB = 'orvane'
const STORE = 'faces'

function db(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => ok(r.result)
    r.onerror = () => fail(r.error)
  })
}

async function put(key: string, blob: Blob) {
  const d = await db()
  await new Promise<void>((ok, fail) => {
    const t = d.transaction(STORE, 'readwrite')
    t.objectStore(STORE).put(blob, key)
    t.oncomplete = () => ok()
    t.onerror = () => fail(t.error)
  })
}

async function get(key: string): Promise<Blob | undefined> {
  const d = await db()
  return new Promise((ok, fail) => {
    const r = d.transaction(STORE).objectStore(STORE).get(key)
    r.onsuccess = () => ok(r.result as Blob | undefined)
    r.onerror = () => fail(r.error)
  })
}

async function drop(key: string) {
  const d = await db()
  d.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
}

const readMeta = (): OwnMeta[] => {
  try {
    return JSON.parse(localStorage.getItem(META) ?? '[]') as OwnMeta[]
  } catch {
    return []
  }
}

/** a design for the range, its faces at blob addresses */
function toDesign(m: OwnMeta, face: string, sm: string): RangeDesign {
  return {
    id: m.id,
    name: m.name,
    line: m.line,
    source: 'own',
    look: 'stone',
    faces: 1,
    finish: m.line === 'aperto' ? 'matt' : 'glossy',
    note: 'Your design, laid from your picture',
    legacy: false,
    hd: false,
    normal: false,
    aspect: m.master[0] / m.master[1],
    master: m.master,
    own: true,
    colourways: [{ slug: 'own', name: m.name, file: face, sm, swatch: m.swatch, family: m.family }],
  }
}

let version = 0
const listeners = new Set<() => void>()
const bump = () => {
  version++
  listeners.forEach((f) => f())
}

let loading: Promise<void> | null = null

/** registers this device's designs into the range, once */
export function loadOwn() {
  loading ||= (async () => {
    for (const m of readMeta()) {
      if (RANGE.some((d) => d.id === m.id)) continue
      const [face, sm] = await Promise.all([get(`${m.id}:face`), get(`${m.id}:sm`)]).catch(() => [undefined, undefined])
      if (!face || !sm) continue
      RANGE.push(toDesign(m, URL.createObjectURL(face), URL.createObjectURL(sm)))
    }
    bump()
  })().catch(() => bump())
  return loading
}

/** this device's designs, re-rendering once they are registered or change */
export function useOwnDesigns() {
  const [, set] = useState(version)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const on = () => set(version)
    listeners.add(on)
    loadOwn().then(() => setReady(true))
    return () => void listeners.delete(on)
  }, [])
  return { designs: RANGE.filter((d) => d.own), ready }
}

/* ------------------------------------------------------------------ adding one */

/** the nearest of the catalogue's colour families to a mean colour */
function familyOf([r, g, b]: number[]): ColourFamily {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  let best: ColourFamily = 'Grey'
  let dist = Infinity
  for (const f of COLOUR_FAMILIES) {
    if (!f.swatch.startsWith('#')) continue
    const [R, G, B] = hex(f.swatch)
    const dd = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2
    if (dd < dist) {
      dist = dd
      best = f.id
    }
  }
  return best
}

const blobOf = (c: HTMLCanvasElement, q = 0.88) => new Promise<Blob>((ok) => c.toBlob((b) => ok(b!), 'image/webp', q))

/**
 * Saves a picture as a design: cropped to the piece's proportions (taller
 * than wide, as the range's faces are), drawn at the range's size and as a
 * thumbnail, its mean colour taken for the swatch and the colour family.
 */
export async function addOwn(img: HTMLImageElement, opts: { name: string; line: LineId; piece: [number, number]; turn: number }) {
  const [pw, ph] = opts.piece[0] <= opts.piece[1] ? opts.piece : [opts.piece[1], opts.piece[0]]
  // the picture, turned as asked
  const turned = document.createElement('canvas')
  const q = ((opts.turn % 4) + 4) % 4
  turned.width = q % 2 ? img.naturalHeight : img.naturalWidth
  turned.height = q % 2 ? img.naturalWidth : img.naturalHeight
  const tg = turned.getContext('2d')!
  tg.translate(turned.width / 2, turned.height / 2)
  tg.rotate((q * Math.PI) / 2)
  tg.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  // the largest centred crop in the piece's proportions
  const want = pw / ph
  let cw = turned.width
  let ch = turned.height
  if (cw / ch > want) cw = ch * want
  else ch = cw / want
  const sx = (turned.width - cw) / 2
  const sy = (turned.height - ch) / 2
  const draw = (w: number) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = Math.round(w / want)
    c.getContext('2d')!.drawImage(turned, sx, sy, cw, ch, 0, 0, c.width, c.height)
    return c
  }
  const face = draw(want >= 0.9 ? 1200 : 900)
  const sm = draw(180)
  const px = sm.getContext('2d')!.getImageData(0, 0, sm.width, sm.height).data
  const mean = [0, 0, 0]
  for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) mean[k] += px[i + k]
  const n = px.length / 4
  const rgb = mean.map((v) => Math.round(v / n))
  const m: OwnMeta = {
    id: `own-${Date.now().toString(36)}`,
    name: opts.name.trim() || 'Your design',
    line: opts.line,
    master: [pw, ph],
    swatch: '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join(''),
    family: familyOf(rgb),
    created: Date.now(),
  }
  const [fb, sb] = await Promise.all([blobOf(face), blobOf(sm, 0.8)])
  await Promise.all([put(`${m.id}:face`, fb), put(`${m.id}:sm`, sb)])
  localStorage.setItem(META, JSON.stringify([...readMeta(), m]))
  const d = toDesign(m, URL.createObjectURL(fb), URL.createObjectURL(sb))
  RANGE.push(d)
  bump()
  return d
}

export async function removeOwn(id: string) {
  localStorage.setItem(META, JSON.stringify(readMeta().filter((m) => m.id !== id)))
  await Promise.all([drop(`${id}:face`), drop(`${id}:sm`)]).catch(() => {})
  const i = RANGE.findIndex((d) => d.id === id)
  if (i >= 0) RANGE.splice(i, 1)
  bump()
}
