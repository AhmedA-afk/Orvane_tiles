import type { Pattern } from '../configurator/stage-config'
import type { FinishId } from '../data/range'

// SAMPLE SCENES. The Studio's rooms, as data: each one's size, the surfaces a
// visitor can lay (where they sit, how big they are, which stone they start
// in), the places to stand, and where its lamps hang. The 3D for each room
// (its furniture) lives in rooms3d.tsx; this file stays free of three.js so
// the page can build its controls without loading the scene.
//
// Every room is set out the same way round: the floor at y = 0, the room
// centred on the origin, and its glass on the west (−x) side, towards the
// sea and the setting sun.

type V3 = [number, number, number]

export type RoomId = 'living' | 'kitchen' | 'bath' | 'bedroom' | 'pool' | 'lobby' | 'custom'

export interface Plane {
  /** metres, as laid: across × along */
  size: [number, number]
  at: V3
  rot: V3
}

export interface SurfaceDef {
  id: string
  name: string
  note: string
  kind: 'floor' | 'wall' | 'top' | 'outdoor'
  /** one or more planes laid in the same stone */
  planes: Plane[]
  /** slabs stand on end (walls) */
  upright?: boolean
  /** a polished floor mirrors the room */
  mirror?: boolean
  /** translucent onyx lit from behind as the lamps come up */
  backlit?: boolean
  start: { design: string; colourway?: string; format?: string; pattern?: Pattern; finish?: FinishId }
}

export interface ViewDef {
  id: string
  name: string
  pos: V3
  target: V3
  fov: number
}

export interface RoomDef {
  id: RoomId
  name: string
  house: string
  blurb: string
  /** the room's box: width (x), depth (z), height; 0 height for a room open to the sky */
  w: number
  d: number
  h: number
  /** a covered terrace outside the glass, this deep */
  terrace: number
  /** where to stand; the first is where the room opens */
  views: ViewDef[]
  /** where the camera may walk */
  bounds: { x: [number, number]; z: [number, number] }
  lamps: { pendants: V3[]; spots: [number, number][]; low?: V3[] }
  /** the hour the room opens at */
  hour: number
}

const floor = (w: number, d: number, at: V3 = [0, 0, 0]): Plane => ({ size: [w, d], at, rot: [-Math.PI / 2, 0, 0] })
const back = (w: number, h: number, d: number, y0 = 0): Plane => ({ size: [w, h], at: [0, y0 + h / 2, -d / 2 + 0.005], rot: [0, 0, 0] })

export const ROOMS: RoomDef[] = [
  {
    id: 'living',
    name: 'Living room',
    house: 'The Lake House',
    blurb: 'A room 7.2 × 6.4 m, all glass to the west, with a covered terrace and the sea beyond.',
    w: 7.2,
    d: 6.4,
    h: 3.2,
    terrace: 4,
    views: [
      { id: 'entrance', name: 'Entrance', pos: [2.95, 1.6, 2.9], target: [-2.1, 0.95, -2.0], fov: 62 },
      { id: 'sofa', name: 'Sofa', pos: [2.45, 1.12, 0.1], target: [-6.5, 1.15, -0.7], fov: 60 },
      { id: 'glass', name: 'Glass', pos: [-2.9, 1.6, 2.7], target: [-6.4, 1.1, -1.4], fov: 62 },
      { id: 'terrace', name: 'Terrace', pos: [-6.9, 1.6, 1.9], target: [1.2, 1.1, -1.4], fov: 62 },
    ],
    bounds: { x: [-7.1, 3.1], z: [-2.7, 2.7] },
    lamps: { pendants: [[0.9, 2.0, 0.1]], spots: [[-1.9, -1.9], [1.6, -2.3], [0.9, 2.3]] },
    hour: 18.1,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    house: 'The Cliff House',
    blurb: 'A cook’s kitchen 6.4 × 5.6 m: a waterfall island, a slab splashback, the sea through the glass.',
    w: 6.4,
    d: 5.6,
    h: 3.0,
    terrace: 0,
    views: [
      { id: 'entrance', name: 'Entrance', pos: [2.75, 1.6, 2.35], target: [-1.6, 0.9, -1.8], fov: 62 },
      { id: 'island', name: 'Island', pos: [0.4, 1.35, 1.9], target: [0.3, 1.0, -2.8], fov: 58 },
      { id: 'glass', name: 'Glass', pos: [-2.6, 1.6, 2.2], target: [2.4, 1.0, -1.6], fov: 62 },
    ],
    bounds: { x: [-2.8, 2.7], z: [-2.0, 2.4] },
    lamps: { pendants: [[-0.5, 1.95, -0.4], [0.4, 1.95, -0.4], [1.3, 1.95, -0.4]], spots: [[-2.0, -2.3], [0.4, -2.3], [2.2, 1.6]] },
    hour: 9.2,
  },
  {
    id: 'bath',
    name: 'Bathroom',
    house: 'The Lake Pavilion',
    blurb: 'A spa bathroom 4.4 × 3.8 m: a freestanding bath at the glass, a walk-in shower, one stone throughout.',
    w: 4.4,
    d: 3.8,
    h: 2.9,
    terrace: 0,
    views: [
      { id: 'door', name: 'Door', pos: [0.45, 1.6, 1.7], target: [-1.6, 0.85, -1.3], fov: 66 },
      { id: 'bath', name: 'Bath', pos: [0.6, 1.25, 1.4], target: [-2.6, 0.9, 0.2], fov: 62 },
      { id: 'vanity', name: 'Vanity', pos: [0.2, 1.6, 0.9], target: [0.2, 1.2, -2.2], fov: 64 },
    ],
    bounds: { x: [-1.7, 1.9], z: [-0.6, 1.6] },
    lamps: { pendants: [], spots: [[-1.1, 0.4], [0.4, -1.2], [1.4, 0.6]], low: [[0.2, 1.75, -1.75]] },
    hour: 7.4,
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    house: 'The Cliff House',
    blurb: 'A bedroom 5.6 × 5 m: a stone wall behind the bed, a floor of planks, the sea at its foot.',
    w: 5.6,
    d: 5.0,
    h: 3.0,
    terrace: 0,
    views: [
      { id: 'door', name: 'Door', pos: [1.85, 1.6, 2.1], target: [-1.4, 0.85, -1.9], fov: 64 },
      { id: 'bed', name: 'Bed', pos: [0.3, 1.0, -0.1], target: [-6, 1.1, 0.4], fov: 60 },
      { id: 'glass', name: 'Glass', pos: [-2.2, 1.6, 2.0], target: [1.6, 1.0, -2.2], fov: 64 },
    ],
    bounds: { x: [-2.4, 2.4], z: [-0.4, 2.1] },
    lamps: { pendants: [], spots: [[-1.2, 1.4], [1.4, 1.4]], low: [[-1.25, 0.75, -1.95], [1.85, 0.75, -1.95]] },
    hour: 20.4,
  },
  {
    id: 'pool',
    name: 'Pool terrace',
    house: 'The Lake House',
    blurb: 'A deck 14 × 10 m around an infinity pool, the house’s stone wall behind it, the sea in front.',
    w: 14,
    d: 10,
    h: 0,
    terrace: 0,
    views: [
      { id: 'deck', name: 'Deck', pos: [5.6, 1.6, 4.0], target: [-3.0, 0.4, -1.6], fov: 60 },
      { id: 'pool', name: 'Pool edge', pos: [-4.6, 1.5, 3.6], target: [3.0, 1.2, -3.4], fov: 62 },
      { id: 'house', name: 'House', pos: [-5.8, 1.6, -0.2], target: [4.0, 1.3, -4.4], fov: 60 },
    ],
    bounds: { x: [-6.6, 6.6], z: [-4.0, 4.6] },
    lamps: { pendants: [], spots: [], low: [[-5.5, 0.35, -4.4], [0, 0.35, -4.4], [5.5, 0.35, -4.4], [-5.5, 0.35, 4.6], [5.5, 0.35, 4.6]] },
    hour: 17.6,
  },
  {
    id: 'lobby',
    name: 'Hotel lobby',
    house: 'Hotel Orvane',
    blurb: 'A double-height lobby 14 × 10 m: a reception desk in bookmatched onyx before a wall of it.',
    w: 14,
    d: 10,
    h: 5.2,
    terrace: 0,
    views: [
      { id: 'entrance', name: 'Entrance', pos: [5.8, 1.6, 4.2], target: [-2.4, 1.6, -4.0], fov: 64 },
      { id: 'desk', name: 'Desk', pos: [1.6, 1.6, 0.2], target: [1.6, 1.4, -5], fov: 62 },
      { id: 'glass', name: 'Glass', pos: [-5.8, 1.6, 4.0], target: [4.0, 1.8, -4.0], fov: 64 },
    ],
    bounds: { x: [-6.6, 6.6], z: [-2.2, 4.6] },
    lamps: {
      pendants: [[-3.2, 3.6, 0.6], [0, 3.6, 0.6], [3.2, 3.6, 0.6]],
      spots: [[-4.5, -3.6], [-1.5, -3.6], [1.5, -3.6], [4.5, -3.6], [-3, 2.5], [3, 2.5]],
    },
    hour: 19.2,
  },
]

/**
 * Your own room, to your measurements: a box with glass on one side, its
 * floor and the wall facing the glass to lay, a sofa and a table if there is
 * room for them, and downlights spread over the ceiling.
 */
export function customRoom(w: number, d: number, h: number): RoomDef {
  return {
    id: 'custom',
    name: 'Your room',
    house: 'Your measurements',
    blurb: `A room ${w} × ${d} m and ${h} m high, laid to your sizes.`,
    w,
    d,
    h,
    terrace: 0,
    views: [
      { id: 'entrance', name: 'Door', pos: [w / 2 - 0.45, 1.6, d / 2 - 0.45], target: [-w / 2 + 0.5, 0.85, -d / 2 + 0.5], fov: 66 },
      { id: 'glass', name: 'Glass', pos: [-w / 2 + 0.45, 1.6, d / 2 - 0.45], target: [w / 2 - 0.5, 1.0, -d / 2 + 0.5], fov: 66 },
    ],
    bounds: { x: [-w / 2 + 0.35, w / 2 - 0.35], z: [-d / 2 + 0.35, d / 2 - 0.35] },
    lamps: {
      pendants: [],
      spots: [
        [-w / 4, -d / 4],
        [w / 4, -d / 4],
        [-w / 4, d / 4],
        [w / 4, d / 4],
      ],
    },
    hour: 11,
  }
}

export function customSurfaces(w: number, d: number, h: number): SurfaceDef[] {
  return [
    {
      id: 'floor',
      name: 'Floor',
      note: `Your floor, ${w} × ${d} m`,
      kind: 'floor',
      planes: [floor(w, d)],
      mirror: true,
      start: { design: 'statuario', format: '1200x2400', finish: 'glossy' },
    },
    {
      id: 'wall',
      name: 'Wall',
      note: `The wall facing the glass, ${w} × ${h} m`,
      kind: 'wall',
      planes: [back(w, h, d)],
      upright: true,
      start: { design: 'armani', format: '1200x2400', finish: 'satin' },
    },
  ]
}

export const CUSTOM_DEFAULT: [number, number, number] = [5, 4.2, 2.8]

export const roomById = (id: string) => ROOMS.find((r) => r.id === id) ?? ROOMS[0]

/** the surfaces of each room: where they are and what they start in */
export const SURFACE_DEFS: Record<Exclude<RoomId, 'custom'>, SurfaceDef[]> = {
  living: [
    {
      id: 'floor',
      name: 'Floor',
      note: 'The living room floor, 7.2 × 6.4 m',
      kind: 'floor',
      planes: [floor(7.2, 6.4)],
      mirror: true,
      start: { design: 'calacatta', format: '1600x3200', finish: 'specchio' },
    },
    {
      id: 'wall',
      name: 'Feature wall',
      note: 'The wall facing the glass, 7.2 × 3.2 m',
      kind: 'wall',
      planes: [back(7.2, 3.2, 6.4)],
      upright: true,
      start: { design: 'miele', format: '1600x3200', pattern: 'bookmatch', finish: 'glossy' },
    },
    {
      id: 'terrace',
      name: 'Terrace',
      note: 'Outside the glass, 4 × 6.4 m',
      kind: 'outdoor',
      planes: [floor(4, 6.4, [-5.6, 0, 0])],
      start: { design: 'trav-oro', format: '600x1200', finish: 'grip' },
    },
  ],
  kitchen: [
    {
      id: 'floor',
      name: 'Floor',
      note: 'The kitchen floor, 6.4 × 5.6 m',
      kind: 'floor',
      planes: [floor(6.4, 5.6)],
      mirror: true,
      start: { design: 'taupe', format: '1200x2400', finish: 'satin' },
    },
    {
      id: 'island',
      name: 'Island',
      note: 'A waterfall island 2.8 × 1.1 m, its top and both ends',
      kind: 'top',
      planes: [
        { size: [2.8, 1.1], at: [0.4, 0.94, -0.4], rot: [-Math.PI / 2, 0, 0] },
        { size: [1.1, 0.94], at: [-1.0, 0.47, -0.4], rot: [0, -Math.PI / 2, 0] },
        { size: [1.1, 0.94], at: [1.8, 0.47, -0.4], rot: [0, Math.PI / 2, 0] },
        { size: [2.8, 0.94], at: [0.4, 0.47, 0.15], rot: [0, 0, 0] },
      ],
      start: { design: 'calacatta', colourway: 'viola', format: '1600x3200', finish: 'glossy' },
    },
    {
      id: 'splash',
      name: 'Counter and splashback',
      note: 'The worktop and the wall above it to the ceiling, 4.2 m long',
      kind: 'wall',
      planes: [
        { size: [4.2, 2.06], at: [-0.2, 0.94 + 1.03, -2.8 + 0.006], rot: [0, 0, 0] },
        { size: [4.2, 0.65], at: [-0.2, 0.942, -2.8 + 0.325], rot: [-Math.PI / 2, 0, 0] },
      ],
      start: { design: 'calacatta', colourway: 'viola', format: '1600x3200', pattern: 'bookmatch', finish: 'glossy' },
    },
  ],
  bath: [
    {
      id: 'floor',
      name: 'Floor',
      note: 'The bathroom floor, 4.4 × 3.8 m',
      kind: 'floor',
      planes: [floor(4.4, 3.8)],
      start: { design: 'argento', format: '600x1200', finish: 'presa' },
    },
    {
      id: 'walls',
      name: 'Walls',
      note: 'The two stone walls, 4.4 and 3.8 m long',
      kind: 'wall',
      planes: [back(4.4, 2.9, 3.8), { size: [3.8, 2.9], at: [2.2 - 0.005, 1.45, 0], rot: [0, -Math.PI / 2, 0] }],
      upright: true,
      start: { design: 'trav-bianco', format: '1200x2400', finish: 'satin' },
    },
    {
      id: 'vanity',
      name: 'Vanity',
      note: 'A floating top 1.8 × 0.55 m with a 100 mm apron',
      kind: 'top',
      planes: [
        { size: [1.8, 0.55], at: [0.2, 0.86, -1.9 + 0.275], rot: [-Math.PI / 2, 0, 0] },
        { size: [1.8, 0.1], at: [0.2, 0.81, -1.9 + 0.55], rot: [0, 0, 0] },
      ],
      start: { design: 'argento', format: '1200x2400', finish: 'satin' },
    },
  ],
  bedroom: [
    {
      id: 'floor',
      name: 'Floor',
      note: 'The bedroom floor, 5.6 × 5 m',
      kind: 'floor',
      planes: [floor(5.6, 5.0)],
      start: { design: 'rovere', format: '200x1200', pattern: 'herringbone', finish: 'matt' },
    },
    {
      id: 'wall',
      name: 'Bed wall',
      note: 'The wall behind the bed, 5.6 × 3 m',
      kind: 'wall',
      planes: [back(5.6, 3.0, 5.0)],
      upright: true,
      start: { design: 'statuario', format: '1600x3200', pattern: 'bookmatch', finish: 'satin' },
    },
  ],
  pool: [
    {
      id: 'deck',
      name: 'Deck',
      note: 'The deck and the pool’s edge, 14 × 10 m',
      kind: 'outdoor',
      planes: [floor(14, 10)],
      start: { design: 'trav-oro', format: '600x1200', finish: 'grip' },
    },
    {
      id: 'facade',
      name: 'House wall',
      note: 'The house’s wall along the deck, 14 × 3.6 m',
      kind: 'wall',
      planes: [{ size: [14, 3.6], at: [0, 1.8, -5 + 0.005], rot: [0, 0, 0] }],
      start: { design: 'ardesia', format: '1200x1200', finish: 'matt' },
    },
  ],
  lobby: [
    {
      id: 'floor',
      name: 'Floor',
      note: 'The lobby floor, 14 × 10 m',
      kind: 'floor',
      planes: [floor(14, 10)],
      mirror: true,
      start: { design: 'nero', format: '1800x3600', finish: 'specchio' },
    },
    {
      id: 'wall',
      name: 'Feature wall',
      note: 'The double-height wall behind the desk, 14 × 5.2 m',
      kind: 'wall',
      planes: [back(14, 5.2, 10)],
      upright: true,
      backlit: true,
      start: { design: 'miele', format: '1600x3200', pattern: 'bookmatch', finish: 'glossy' },
    },
    {
      id: 'desk',
      name: 'Reception desk',
      note: 'The desk’s front and top, 4.8 m long',
      kind: 'top',
      planes: [
        { size: [4.8, 1.1], at: [1.6, 0.55, -2.4], rot: [0, 0, 0] },
        { size: [4.8, 0.7], at: [1.6, 1.1, -2.75], rot: [-Math.PI / 2, 0, 0] },
      ],
      backlit: true,
      start: { design: 'azzurro', format: '1600x3200', pattern: 'bookmatch', finish: 'specchio' },
    },
  ],
}

/** lighting moods for the lamps, on top of the hour */
export const MOODS = [
  { id: 'warm', name: 'Warm', color: '#ffc98f', level: 1 },
  { id: 'neutral', name: 'Neutral', color: '#fff1e0', level: 1 },
  { id: 'gallery', name: 'Gallery', color: '#ffe2bd', level: 1.6 },
  { id: 'off', name: 'Off', color: '#ffc98f', level: 0 },
] as const

export type MoodId = (typeof MOODS)[number]['id']

export const WEATHER = [
  { id: 'clear', name: 'Clear' },
  { id: 'cloud', name: 'Overcast' },
  { id: 'rain', name: 'Rain' },
] as const

export type WeatherId = (typeof WEATHER)[number]['id']
