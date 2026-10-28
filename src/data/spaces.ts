import type { LineId } from './range/lines'
import { INTERIORS, type Interior } from './range/interiors'

// SAMPLE DATA. The spaces: five places in a house the range is made for, each
// with the rooms that show it, the lines that suit it and the facts a buyer
// asks about first. The rooms come from the interiors (docs/imagery.md).

export type SpaceId = 'kitchens' | 'bathrooms' | 'living' | 'hospitality' | 'outdoors'

export interface Space {
  id: SpaceId
  name: string
  /** the page's title, a sentence */
  title: string
  lead: string
  /** the room that opens the page */
  hero: string
  /** which interiors belong here, by room name */
  rooms: string[]
  /** interiors that belong here whatever their room is called */
  also?: string[]
  lines: LineId[]
}

export const SPACES: Space[] = [
  {
    id: 'kitchens',
    name: 'Kitchens',
    title: 'Kitchens.',
    lead: 'Counters, islands and splashbacks cut from 12 and 20 mm slabs, with edges that read as solid stone and a surface that shrugs off a hot pan.',
    hero: 'cucina-calacatta-island',
    rooms: ['Kitchen', 'Outdoor kitchen'],
    also: ['cucina-azul-table'],
    lines: ['cucina', 'maesta', 'velo'],
  },
  {
    id: 'bathrooms',
    name: 'Bathrooms',
    title: 'Bathrooms.',
    lead: 'Floors that grip when they are wet, walls in 6 mm panels, and the vanity top in the same stone, so the room reads as one material.',
    hero: 'terme-bianco-shower',
    rooms: ['Bathroom', 'Shower', 'Steam room', 'Powder room', 'Spa lounge', 'Indoor pool'],
    lines: ['terme', 'gemelli', 'maesta', 'tattile'],
  },
  {
    id: 'living',
    name: 'Living',
    title: 'Rooms to live in.',
    lead: 'Floors with almost no joints, walls in a single slab, and one stone carried from the hall to the bedroom.',
    hero: 'maesta-calacatta-living',
    rooms: ['Living room', 'Lounge', 'Bedroom', 'Entrance hall', 'Dining room', 'Staircase'],
    lines: ['maesta', 'legno', 'velo', 'gemelli'],
  },
  {
    id: 'hospitality',
    name: 'Hotels and bars',
    title: 'Hotels, bars and shops.',
    lead: 'Lobbies, bars and shop floors that take thousands of footsteps a day, in stone that keeps its polish and is cut to the drawing.',
    hero: 'gemelli-miele-lobby',
    rooms: ['Hotel lobby', 'Bar', 'Restaurant', 'Boutique', 'Corridor'],
    lines: ['gemelli', 'tattile', 'maesta'],
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    title: 'Outdoors.',
    lead: 'Twenty millimetres of porcelain for terraces, pools and drives: laid on grass, gravel or pedestals, frost-proof, and cool underfoot.',
    hero: 'aperto-travertino-pool',
    rooms: ['Pool terrace', 'Courtyard', 'Garden', 'Facade', 'Roof terrace', 'Entrance court', 'Pool deck', 'Outdoor kitchen', 'Entrance'],
    lines: ['aperto', 'legno', 'tattile'],
  },
]

export const spaceById = (id: string) => SPACES.find((s) => s.id === id)

/** a space's rooms, its opening room first */
export function roomsOf(s: Space): Interior[] {
  const mine = INTERIORS.filter((i) => s.rooms.includes(i.room) || s.also?.includes(i.id))
  const hero = mine.find((i) => i.id === s.hero)
  return hero ? [hero, ...mine.filter((i) => i !== hero)] : mine
}
