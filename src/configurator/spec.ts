import { DEMO } from '../data/demo'
import {
  finishById,
  formatById,
  formatLabel,
  labelOf,
  lineById,
  skuFor,
  specFor,
  techById,
  type RangeDesign,
} from '../data/range'
import { printSheet, type SheetSection } from '../lib/specSheet'
import type { SampleConfig } from '../lib/quote'
import { EDGES, type Edge } from './EdgeProfiles'

// One configuration, written out: for the specification table, the printed
// sheet and the message to the studio. SAMPLE DATA, like everything it draws on.

const kg = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)} kg`

export function configSpec(d: RangeDesign, c: SampleConfig, edge?: Edge) {
  const f = formatById(c.format)!
  const fin = finishById(c.finish)
  const line = lineById(d.line)
  const cw = d.colourways.find((x) => x.slug === c.colourway) ?? d.colourways[0]
  const s = specFor(d, c.format, c.thickness, c.finish)
  const sku = skuFor(d, c.format, c.thickness, c.finish, cw.slug)
  const unit = s.packing.unit
  const edgeName = edge ? EDGES.find((e) => e.id === edge)?.name : undefined
  const sections: SheetSection[] = [
    {
      title: 'Product',
      rows: [
        ['Line', `${line.name}, ${line.kind.toLowerCase()}`],
        ['Design', d.name],
        ['Colourway', cw.name],
        ['Format', `${formatLabel(f)} mm`],
        ['Thickness', `${c.thickness} mm`],
        ['Finish', `${fin.name}, ${fin.gloss} gloss units`],
        ...(edgeName ? ([['Edge', edgeName]] as [string, string][]) : []),
        ['Faces', d.faces === 1 ? 'One face' : `${d.faces} random faces`],
        ['Code', sku],
      ],
    },
    {
      title: 'Technical',
      rows: [
        ['Body', s.techs.includes('corpo') ? 'Full-body porcelain' : 'Glazed porcelain'],
        ['Water absorption', '≤ 0.1%, group BIa'],
        ['Breaking strength', c.thickness >= 12 ? '≥ 50 N/mm²' : '≥ 40 N/mm²'],
        ['Slip rating', `${s.slip} (DIN 51130)`],
        ['Weight', `${s.kgPerM2.toFixed(1)} kg per m²`],
        ['For', s.uses.join(', ')],
        ['Technologies', s.techs.map((t) => techById(t).name).join(', ') || 'None'],
      ],
    },
    {
      title: 'Packing',
      rows: [
        [`Pieces per ${unit}`, String(s.packing.pieces)],
        [`m² per ${unit}`, s.packing.m2.toFixed(2)],
        [`Weight per ${unit}`, kg(s.packing.kg)],
        ['Weight per piece', kg(s.kgPerPiece)],
        ['m² per piece', s.area.toFixed(2)],
      ],
    },
  ]
  return { f, fin, line, cw, s, sku, sections, edgeName }
}

export function printConfig(d: RangeDesign, c: SampleConfig, edge?: Edge) {
  const { f, fin, cw, s, sections, line } = configSpec(d, c, edge)
  printSheet({
    title: labelOf(d, cw.slug),
    sub: `${line.name}. ${formatLabel(f)} mm, ${c.thickness} mm, ${fin.name.toLowerCase()} finish. ${d.note}.`,
    sections,
    notes: [
      ...(s.demo.includes('sizes') ? [DEMO.sizes] : []),
      ...(s.demo.includes('technology') ? [DEMO.technology] : []),
      DEMO.figures,
      DEMO.company,
    ],
  })
}

/** the line for a message: "Calacatta Oro, Viola, 1600 × 3200 mm, 12 mm, specchio, mitred 60 edge" */
export function configLine(d: RangeDesign, c: SampleConfig, edge?: Edge) {
  const { f, fin, cw, edgeName } = configSpec(d, c, edge)
  return `${labelOf(d, cw.slug)}, ${formatLabel(f)} mm, ${c.thickness} mm, ${fin.name.toLowerCase()}${edgeName ? `, ${edgeName.toLowerCase()} edge` : ''}`
}
