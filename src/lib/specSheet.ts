import { BODY_SPECS, SLIP, containerLoad, sizeById, type Product } from '../data/catalog'
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

/**
 * Opens a print-ready spec sheet in a new tab. The browser's print dialog
 * saves it as a PDF, so every design has a sheet without a PDF pipeline.
 */
export function openSpecSheet(p: Product) {
  const { technical, packing } = specRows(p)
  const table = (rows: [string, string][]) =>
    rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.name)} spec sheet</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:18mm}body{font-family:Archivo,system-ui,sans-serif;color:#142030;margin:0 auto;max-width:720px;padding:32px 24px}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #142030;padding-bottom:10px;margin-bottom:28px;font-weight:700;font-stretch:114%}
header span{font-weight:400;font-stretch:100%;color:#566372;font-size:13px}
h1{font-size:40px;font-stretch:118%;letter-spacing:-.02em;margin:0 0 4px}p.sub{color:#566372;margin:0 0 28px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:32px}h2{font-size:15px;margin:0 0 8px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:7px 0;border-bottom:1px solid #d6dadb}th{font-weight:400;color:#566372}td{font-weight:600}
footer{margin-top:36px;font-size:12px;color:#566372;display:flex;justify-content:space-between;gap:16px}
.note{margin-top:20px;font-size:12px;color:#566372}
</style></head><body>
<header>${esc(BRAND)}<span>Product specification</span></header>
<h1>${esc(p.name)}</h1><p class="sub">${esc(sizeById(p.size).label)} mm ${esc(p.body)}, ${esc(p.finish.toLowerCase())} finish. Certified CE and ISO 13006.</p>
<div class="cols"><section><h2>Technical</h2><table>${table(technical)}</table></section>
<section><h2>Packing</h2><table>${table(packing)}</table></section></div>
<p class="note">Container figures are indicative for a 26 t payload. Your quote confirms the final packing list.</p>
<footer><span>${ADDRESS.map(esc).join('<br>')}</span><span>${esc(EMAIL)}</span></footer>
<script>document.fonts.ready.then(()=>setTimeout(()=>print(),200))</script>
</body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
