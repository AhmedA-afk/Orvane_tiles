// The hour of the day, as light. A simple sun for a house on the coast at
// about 23° N: up at 06:12, down at 18:48, 68° high at noon, rising in the
// east and setting in the west, where the room's glass wall faces. From the
// hour come the sun's direction, colour and strength, how bright the sky is,
// and how far up the lamps are turned. No three.js here, so the page can
// label the dial without loading the 3D.

export const RISE = 6.2
export const SET = 18.8
const NOON_ELEVATION = 68

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const hex = (rgb: number[]) =>
  '#' +
  rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
const lerpRgb = (a: number[], b: number[], t: number) => a.map((v, i) => mix(v, b[i], t))

export interface Light {
  /** degrees above the horizon (below when negative) */
  elevation: number
  /** a unit vector from the room towards the sun: x east, y up, z south */
  dir: [number, number, number]
  sunColor: string
  sunIntensity: number
  /** 0 at night, 1 in full day */
  day: number
  /** 0 off, 1 fully on */
  lamps: number
  /** the colour of the sky's light in the room */
  skyColor: string
  /** the colour of the sky behind the glass at night, when the sky model goes black */
  night: string
  /** the sky overhead and at the horizon */
  zenith: string
  horizon: string
  /** the sea, which takes the sky's colour */
  sea: string
  exposure: number
}

// the sky through the day, keyed by the sun's elevation: [degrees, zenith, horizon]
const SKY: [number, number[], number[]][] = [
  [-18, [5, 8, 15], [11, 18, 34]],
  [-8, [11, 21, 48], [27, 38, 71]],
  [-3, [29, 42, 85], [138, 90, 106]],
  [2, [58, 82, 136], [240, 138, 90]],
  [8, [79, 115, 170], [245, 178, 122]],
  [20, [91, 138, 196], [217, 227, 234]],
  [70, [79, 134, 198], [201, 220, 235]],
]

function skyAt(e: number) {
  const i = SKY.findIndex(([d]) => d > e)
  if (i <= 0) return i === 0 ? SKY[0] : SKY[SKY.length - 1]
  const [d0, z0, h0] = SKY[i - 1]
  const [d1, z1, h1] = SKY[i]
  const t = (e - d0) / (d1 - d0)
  return [e, lerpRgb(z0, z1, t), lerpRgb(h0, h1, t)] as [number, number[], number[]]
}

export function lightAt(hour: number): Light {
  const h = ((hour % 24) + 24) % 24
  const span = SET - RISE
  const p = (h - RISE) / span
  // above the horizon through the day; below it, a shallow arc through the night
  const elevation =
    p >= 0 && p <= 1 ? NOON_ELEVATION * Math.sin(Math.PI * p) : -18 * Math.sin(Math.PI * (((h - SET + 24) % 24) / (24 - span)))
  // azimuth from south, positive towards the west: -80° at sunrise, +80° at sunset
  const az = (((p >= 0 && p <= 1 ? p : p < 0 ? 0 : 1) - 0.5) * 160 * Math.PI) / 180
  const el = (elevation * Math.PI) / 180
  const dir: [number, number, number] = [-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]

  const day = smooth(-4, 10, elevation)
  const low = 1 - smooth(4, 30, elevation)
  const sunRgb = lerpRgb([255, 244, 226], [255, 150, 70], low)
  const skyRgb = lerpRgb(lerpRgb([200, 214, 232], [250, 196, 150], low * 0.8), [40, 52, 86], 1 - day)
  const [, zen, hor] = skyAt(elevation)
  return {
    elevation,
    dir,
    sunColor: hex(sunRgb),
    sunIntensity: 5.2 * smooth(-1, 7, elevation),
    day,
    lamps: 1 - smooth(-2, 14, elevation),
    skyColor: hex(skyRgb),
    night: hex(lerpRgb([12, 20, 38], [28, 40, 70], smooth(-18, -4, elevation))),
    zenith: hex(zen),
    horizon: hex(hor),
    sea: hex(lerpRgb(lerpRgb(zen, hor, 0.35), [8, 30, 46], 0.45)),
    exposure: mix(1.35, 1.05, day),
  }
}

/** "18:40" */
export const clock = (hour: number) => {
  const h = ((hour % 24) + 24) % 24
  const m = Math.round((h % 1) * 60)
  return `${String(Math.floor(h) + (m === 60 ? 1 : 0)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** the named moments on the dial */
export const MOMENTS = [
  { hour: 6.6, name: 'Dawn' },
  { hour: 12.5, name: 'Noon' },
  { hour: 18.3, name: 'Golden hour' },
  { hour: 21.5, name: 'Night' },
]

const toRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mixHex = (a: string, b: string, t: number) => hex(lerpRgb(toRgb(a), toRgb(b), clamp(t)))

/** the same hour under cloud or rain: the sun hidden, the sky and sea gone grey, the light flat and soft */
export function weathered(L: Light, weather: 'clear' | 'cloud' | 'rain'): Light {
  if (weather === 'clear') return L
  const rain = weather === 'rain'
  const t = 0.35 + 0.55 * L.day
  return {
    ...L,
    sunIntensity: L.sunIntensity * (rain ? 0.03 : 0.1),
    zenith: mixHex(L.zenith, rain ? '#4d545b' : '#8e959c', t),
    horizon: mixHex(L.horizon, rain ? '#7b8288' : '#bfc4c8', t),
    skyColor: mixHex(L.skyColor, rain ? '#9aa1a8' : '#cfd3d6', t),
    sea: mixHex(L.sea, rain ? '#323b40' : '#56636a', t),
    sunColor: mixHex(L.sunColor, '#d8dde2', 0.8),
    day: L.day * (rain ? 0.7 : 0.88),
    lamps: Math.max(L.lamps, rain ? 0.45 : 0.2),
    exposure: L.exposure * (rain ? 1.1 : 1.04),
  }
}
