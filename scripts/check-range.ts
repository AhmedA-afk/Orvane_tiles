// node scripts/check-range.ts
// Checks the range: the catalogue is consistent, every face, small face and
// normal map it names is on disk, and the first fifteen designs (which the
// current pages use) are all in it. Prints the counts and a few sample specs.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUCTS } from '../src/data/catalog.ts'
import { COUNTS, RANGE, checkRange, designById, skuFor, specFor } from '../src/data/range/index.ts'

const tiles = join(import.meta.dirname, '../public/tiles')
const problems = checkRange()
for (const d of RANGE) {
  for (const c of d.colourways) {
    for (const f of [c.file, c.sm]) if (!existsSync(join(tiles, f))) problems.push(`${d.id}: missing ${f}`)
  }
  if (d.normal && !existsSync(join(tiles, `${d.id}-n.webp`))) problems.push(`${d.id}: missing normal map`)
}
for (const p of PRODUCTS) if (!designById(p.design)) problems.push(`legacy ${p.design} is not in the range`)

console.log(COUNTS)
for (const [id, format, mm, finish, cw] of [
  ['calacatta', '1800x3600', 12, 'specchio', 'viola'],
  ['rovere', '300x2400', 9, 'matt', 'fume'],
  ['travertino', '600x1200', 20, 'grip', 'classico'],
] as const) {
  const d = designById(id)!
  const s = specFor(d, format, mm, finish)
  console.log(
    skuFor(d, format, mm, finish, cw),
    `${s.kgPerM2.toFixed(1)} kg/m² · ${s.kgPerPiece.toFixed(1)} kg each · ${s.packing.pieces} per ${s.packing.unit} · ${s.slip} · ${s.techs.join(', ') || 'no tech'} · notes: ${s.demo.join(', ') || 'none'}`,
  )
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('range ok')
