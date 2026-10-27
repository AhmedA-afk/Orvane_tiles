// SAMPLE DATA. Every product, packing figure and spec below is a realistic
// placeholder for the demo. Replace with the manufacturer's own packing list
// and test reports before this goes in front of a buyer.

export type SizeId = '600x600' | '800x800' | '600x1200' | '800x1600' | '200x1200' | '300x600'
export type Finish = 'Glossy' | 'Matt' | 'Carving'
export type Body = 'GVT' | 'PGVT' | 'Double charge' | 'Porcelain'
export type Room = 'Living' | 'Kitchen' | 'Bathroom' | 'Outdoor' | 'Commercial'

export interface Size {
  id: SizeId
  w: number
  h: number
  label: string
  thickness: number
  pcsPerBox: number
  sqmPerBox: number
  kgPerBox: number
  boxesPerPallet: number
}

export const SIZES: Size[] = [
  { id: '600x600', w: 600, h: 600, label: '600 × 600', thickness: 9, pcsPerBox: 4, sqmPerBox: 1.44, kgPerBox: 30, boxesPerPallet: 48 },
  { id: '800x800', w: 800, h: 800, label: '800 × 800', thickness: 9, pcsPerBox: 3, sqmPerBox: 1.92, kgPerBox: 41, boxesPerPallet: 36 },
  { id: '600x1200', w: 600, h: 1200, label: '600 × 1200', thickness: 9, pcsPerBox: 2, sqmPerBox: 1.44, kgPerBox: 31, boxesPerPallet: 42 },
  { id: '800x1600', w: 800, h: 1600, label: '800 × 1600', thickness: 9, pcsPerBox: 2, sqmPerBox: 2.56, kgPerBox: 57, boxesPerPallet: 24 },
  { id: '200x1200', w: 200, h: 1200, label: '200 × 1200', thickness: 9, pcsPerBox: 5, sqmPerBox: 1.2, kgPerBox: 26, boxesPerPallet: 54 },
  { id: '300x600', w: 300, h: 600, label: '300 × 600', thickness: 8, pcsPerBox: 8, sqmPerBox: 1.44, kgPerBox: 26, boxesPerPallet: 56 },
]

export const sizeById = (id: SizeId) => SIZES.find((s) => s.id === id)!

export const FINISHES: Finish[] = ['Glossy', 'Matt', 'Carving']
export const BODIES: Body[] = ['GVT', 'PGVT', 'Double charge', 'Porcelain']
export const ROOMS: Room[] = ['Living', 'Kitchen', 'Bathroom', 'Outdoor', 'Commercial']

export interface Product {
  id: string
  design: string
  name: string
  size: SizeId
  finish: Finish
  body: Body
  rooms: Room[]
  faces: number
}

export const PRODUCTS: Product[] = [
  { id: 'statuario-8016', design: 'statuario', name: 'Statuario Bianco', size: '800x1600', finish: 'Glossy', body: 'PGVT', rooms: ['Living', 'Bathroom', 'Commercial'], faces: 8 },
  { id: 'calacatta-6012', design: 'calacatta', name: 'Calacatta Oro', size: '600x1200', finish: 'Glossy', body: 'PGVT', rooms: ['Living', 'Kitchen', 'Bathroom'], faces: 6 },
  { id: 'onice-8016', design: 'onice', name: 'Onice Verde', size: '800x1600', finish: 'Glossy', body: 'PGVT', rooms: ['Living', 'Commercial'], faces: 4 },
  { id: 'nero-6012', design: 'nero', name: 'Nero Marquina', size: '600x1200', finish: 'Glossy', body: 'GVT', rooms: ['Living', 'Bathroom', 'Commercial'], faces: 6 },
  { id: 'armani-8016', design: 'armani', name: 'Armani Grigio', size: '800x1600', finish: 'Matt', body: 'Porcelain', rooms: ['Living', 'Commercial'], faces: 6 },
  { id: 'travertino-6012', design: 'travertino', name: 'Travertino Classico', size: '600x1200', finish: 'Carving', body: 'Porcelain', rooms: ['Living', 'Outdoor', 'Commercial'], faces: 8 },
  { id: 'crema-8080', design: 'crema', name: 'Crema Marfil', size: '800x800', finish: 'Glossy', body: 'GVT', rooms: ['Living', 'Kitchen'], faces: 4 },
  { id: 'ivory-8080', design: 'ivory', name: 'Ivory Nano', size: '800x800', finish: 'Glossy', body: 'Double charge', rooms: ['Living', 'Commercial'], faces: 1 },
  { id: 'pepper-6060', design: 'pepper', name: 'Salt & Pepper', size: '600x600', finish: 'Glossy', body: 'Double charge', rooms: ['Commercial', 'Kitchen'], faces: 1 },
  { id: 'cemento-6060', design: 'cemento', name: 'Cemento Grigio', size: '600x600', finish: 'Matt', body: 'Porcelain', rooms: ['Outdoor', 'Kitchen', 'Commercial'], faces: 4 },
  { id: 'terrazzo-6060', design: 'terrazzo', name: 'Terrazzo Venezia', size: '600x600', finish: 'Matt', body: 'GVT', rooms: ['Kitchen', 'Commercial'], faces: 4 },
  { id: 'rovere-2012', design: 'rovere', name: 'Rovere Natural', size: '200x1200', finish: 'Matt', body: 'Porcelain', rooms: ['Living', 'Commercial'], faces: 10 },
  { id: 'teak-2012', design: 'teak', name: 'Teak Antico', size: '200x1200', finish: 'Carving', body: 'GVT', rooms: ['Living', 'Outdoor'], faces: 10 },
  { id: 'pietra-3060', design: 'pietra', name: 'Pietra Grey', size: '300x600', finish: 'Carving', body: 'GVT', rooms: ['Bathroom', 'Kitchen', 'Outdoor'], faces: 4 },
  { id: 'bardiglio-3060', design: 'bardiglio', name: 'Bardiglio Nuvolato', size: '300x600', finish: 'Glossy', body: 'GVT', rooms: ['Bathroom', 'Kitchen'], faces: 4 },
]

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)

/** Technical sheet values by body type (sample, in line with ISO 13006). */
export const BODY_SPECS: Record<Body, { absorption: string; group: string; mor: string }> = {
  GVT: { absorption: '≤ 0.5%', group: 'BIa', mor: '≥ 35 N/mm²' },
  PGVT: { absorption: '≤ 0.5%', group: 'BIa', mor: '≥ 35 N/mm²' },
  'Double charge': { absorption: '≤ 0.1%', group: 'BIa', mor: '≥ 40 N/mm²' },
  Porcelain: { absorption: '≤ 0.1%', group: 'BIa', mor: '≥ 40 N/mm²' },
}

export const SLIP: Record<Finish, string> = { Glossy: 'R9', Matt: 'R10', Carving: 'R11' }

// Containers: tiles hit the payload limit long before the box is full.
export const CONTAINERS = {
  '20ft': { label: '20 ft', payloadKg: 26000, volumeM3: 33.2, palletKg: 25 },
  '40ft': { label: '40 ft', payloadKg: 26500, volumeM3: 67.7, palletKg: 25 },
} as const
export type ContainerId = keyof typeof CONTAINERS

export function containerLoad(size: Size, container: ContainerId) {
  const c = CONTAINERS[container]
  const palletKg = size.boxesPerPallet * size.kgPerBox + c.palletKg
  const pallets = Math.floor(c.payloadKg / palletKg)
  const boxes = pallets * size.boxesPerPallet
  const sqm = boxes * size.sqmPerBox
  const kg = pallets * palletKg
  // ~2.4 t/m³ for fired tile, plus pallet and carton air
  const volume = (kg / 2400) * 1.45
  return { pallets, boxes, sqm, kg, weightShare: kg / c.payloadKg, volumeShare: volume / c.volumeM3 }
}
