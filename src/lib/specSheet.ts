import { BODY_SPECS, SLIP, containerLoad, sizeById, type Product } from '../data/catalog'
import { DEMO } from '../data/demo'
import { ADDRESS, BRAND, EMAIL } from '../data/site'
import { num } from './format'

export function specRows(p: Product) {
  const s = sizeById(p.size)
  const b = BODY_SPECS[p.body]
  const load = containerLoad(s, '20ft')
  return {
    technical: [
      ['Size', `${s.label} mm`],
      ['Thickness', `${s.thickness} mm`],
      ['Body', p.body],
      ['Finish', p.finish],
      ['Water absorption', `${b.absorption}, ${b.group}`],
      ['Breaking strength', b.mor],
      ['Slip rating', SLIP[p.finish]],
      ['Faces', p.faces === 1 ? 'Single face' : `${p.faces} random faces`],
    ] as [string, string][],
    packing: [
      ['Pieces per box', String(s.pcsPerBox)],
      ['m² per box', s.sqmPerBox.toFixed(2)],
      ['Weight per box', `${s.kgPerBox} kg`],
      ['Boxes per pallet', String(s.boxesPerPallet)],
      ['Boxes per 20 ft', num(load.boxes)],
      ['m² per 20 ft', num(load.sqm)],
    ] as [string, string][],
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export interface SheetSection {
  title: string
  rows: [string, string][]
}

/**
 * Opens a print-ready spec sheet in a new tab. The browser's print dialog
 * saves it as a PDF, so every design has a sheet without a PDF pipeline.
 */
export function printSheet({
  title,
  sub,
  sections,
  notes,
  label = 'Product specification',
  columns = 2,
}: {
  title: string
  sub: string
  sections: SheetSection[]
  notes: string[]
  /** what the sheet is, top right */
  label?: string
  columns?: 1 | 2
}) {
  const table = (rows: [string, string][]) =>
    rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}, ${esc(label.toLowerCase())}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:16mm}body{font-family:Geist,system-ui,sans-serif;color:#0b0b0c;margin:0 auto;max-width:740px;padding:32px 24px}
header{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:14px;margin-bottom:40px;font-weight:600;font-size:18px;letter-spacing:-.02em;border-bottom:1px solid #0b0b0c}
header span,.mono{font-family:'Geist Mono',monospace;font-weight:400;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#6a6a6e}
h1{font-weight:600;font-size:52px;letter-spacing:-.05em;line-height:.95;margin:0 0 12px}p.sub{color:#2b2b2e;margin:0 0 36px;font-size:15px}
.cols{display:grid;grid-template-columns:repeat(${columns},1fr);gap:28px 40px}h2{margin:0 0 8px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:7px 0;border-bottom:1px solid #dcdcd7}th{font-weight:400;color:#6a6a6e}td{font-weight:500}
footer{margin-top:40px;font-size:11px;color:#6a6a6e;display:flex;justify-content:space-between;gap:16px}
.notes{margin-top:24px;font-size:11px;color:#6a6a6e;line-height:1.5}
</style></head><body>
<header>${esc(BRAND)}<span>${esc(label)}</span></header>
<h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p>
<div class="cols">${sections.map((x) => `<section><h2 class="mono">${esc(x.title)}</h2><table>${table(x.rows)}</table></section>`).join('')}</div>
<div class="notes">${notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>
<footer><span>${ADDRESS.map(esc).join('<br>')}</span><span>${esc(EMAIL)}</span></footer>
<script>document.fonts.ready.then(()=>setTimeout(()=>print(),200))</script>
</body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** the sheet for one of the first fifteen designs */
export function openSpecSheet(p: Product) {
  const { technical, packing } = specRows(p)
  printSheet({
    title: p.name,
    sub: `${sizeById(p.size).label} mm ${p.body}, ${p.finish.toLowerCase()} finish.`,
    sections: [
      { title: 'Technical', rows: technical },
      { title: 'Packing', rows: packing },
    ],
    notes: ['Container figures are indicative for a 26 t payload. Your quote confirms the final packing list.', DEMO.figures, DEMO.company],
  })
}
