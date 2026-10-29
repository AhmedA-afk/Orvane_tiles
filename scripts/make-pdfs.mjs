// Makes the downloadable catalogues and documents in public/downloads/.
//   node scripts/make-pdfs.mjs [filter]          (dev server on :3000)
// Each document is laid out here as A4 pages in the site's look (porcelain,
// ink, Geist), from the range's own data and pictures, printed to PDF by
// headless Chrome, with its cover saved as a thumbnail. The manifest the
// downloads page reads is written to src/data/downloads.json. Every figure
// in them is sample data for a demo company, and each document says so.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FINISHES, finishById, formatById, formatLabel, LINES, lineById, RANGE, specFor, techById, THICKNESSES } from '../src/data/range/index.ts'
import { pricePerM2 } from '../src/data/trade.ts'
import { CERTS, TESTS } from '../src/data/standards.ts'
import { DEMO } from '../src/data/demo.ts'
import { ADDRESS, EMAIL, WHATSAPP_NUMBER } from '../src/data/site.ts'

const BASE = process.env.RENDER_BASE ?? 'http://localhost:3000'
const OUT = 'public/downloads'
const only = process.argv[2]
const ROOT = new URL('..', import.meta.url).pathname

const shots = JSON.parse(readFileSync(join(ROOT, 'src/data/range/interiors.json'), 'utf8')).shots
const built = JSON.parse(readFileSync(join(ROOT, 'src/data/range/interiors-built.json'), 'utf8'))
const rooms = (line) => shots.filter((s) => s.line === line && built[s.id])

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const img = (path) => `${BASE}${path}`
const room = (id) => img(`/images/interiors/${id}.jpg`)
const card = (d, cw = d.colourways[0].slug) => img(`/renders/range/${d.id}--${cw}.jpg`)
const usd = (n) => `$${n.toFixed(2)}`
const mid = (l) => l.thicknesses[Math.floor(l.thicknesses.length / 2)]
const phone = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
const YEAR = 2026

/* ------------------------------------------------------------------ the look */

const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#f1f1ee;color:#0b0b0c;font-family:Geist,system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:18mm 16mm 22mm;page-break-after:always;background:#f1f1ee}
.page:last-child{page-break-after:auto}
.dark{background:#050506;color:#f1f1ee}
.full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.scrim:after{content:"";position:absolute;inset:40% 0 0;background:linear-gradient(rgba(5,5,6,0),rgba(5,5,6,.78))}
.over{position:absolute;z-index:1;left:16mm;right:16mm}
.mark{display:flex;align-items:center;gap:2.4mm;font-weight:600;font-size:12pt;letter-spacing:-.02em}
.mark i{display:inline-block;width:2.6mm;height:5.2mm;border:.35mm solid currentColor;border-radius:.4mm}
.run{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#6a6a6e}
.dark .run{color:#8e8e93}
h1{font-size:68pt;line-height:.88;letter-spacing:-.055em;font-weight:600;margin:0}
h2{font-size:34pt;line-height:.92;letter-spacing:-.045em;font-weight:600;margin:0 0 5mm}
h3{font-size:12pt;letter-spacing:-.02em;font-weight:600;margin:0 0 2mm}
.kick{font-size:9pt;color:#6a6a6e;margin:0 0 3mm}
.dark .kick{color:#b9b9b4}
.lead{font-size:14pt;line-height:1.35;letter-spacing:-.015em;max-width:140mm;margin:0 0 6mm}
p{font-size:9.5pt;line-height:1.5;margin:0 0 3mm}
table{width:100%;border-collapse:collapse;font-size:8.6pt;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:2.2mm 2mm 2.2mm 0;border-bottom:.2mm solid #d6d6d1;vertical-align:top}
thead th{color:#6a6a6e;font-weight:400;font-size:7.8pt}
tbody th{font-weight:500}
.num{font-variant-numeric:tabular-nums}
.grid{display:grid;gap:4.5mm}
.g4{grid-template-columns:repeat(4,1fr)}.g3{grid-template-columns:repeat(3,1fr)}.g2{grid-template-columns:repeat(2,1fr)}
.card{margin:0}
.card img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:1.6mm;background:#e8e8e4}
.card b{display:block;font-size:8.6pt;font-weight:600;margin-top:1.6mm;letter-spacing:-.01em}
.card span{font-size:7.2pt;color:#6a6a6e;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dots{display:flex;gap:1mm;margin-top:1mm}.dots i{display:block;width:2.4mm;height:2.4mm;border-radius:50%}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:6mm 0 8mm}
.facts div{padding:3.5mm;border-radius:2mm;background:#e8e8e4}
.facts dt{font-size:7.4pt;color:#6a6a6e}.facts dd{margin:1mm 0 0;font-size:10pt;font-weight:600;letter-spacing:-.01em}
.room{width:100%;object-fit:cover;border-radius:2mm;display:block}
.demo{font-size:7pt;color:#6a6a6e;line-height:1.45;max-width:150mm}
.dark .demo{color:#8e8e93}
.toc{display:grid;grid-template-columns:1fr 1fr;gap:3mm 10mm;margin-top:8mm}
.toc div{display:grid;grid-template-columns:1fr auto;padding:3mm 0;border-bottom:.2mm solid #d6d6d1}
.toc b{font-size:13pt;font-weight:600;letter-spacing:-.02em}.toc span{font-size:8.5pt;color:#6a6a6e;grid-column:1}.toc em{font-style:normal;grid-row:1/3;grid-column:2;align-self:center;font-size:9pt}
.cols{columns:2;column-gap:9mm}.cols h3{break-after:avoid;font-size:13pt;margin-top:2mm}.cols p{break-inside:avoid;font-size:10.2pt}
.chip{display:inline-block;padding:1mm 2.6mm;border-radius:10mm;background:#e8e8e4;font-size:7.6pt;margin:0 1mm 1mm 0}
`

const shell = (title, pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${pages.join('')}</body></html>`

const mark = (light = false) => `<div class="mark" style="color:${light ? '#f1f1ee' : '#0b0b0c'}"><i></i>Orvane</div>`
const run = (doc, n) => `<div class="run"><span>Orvane Ceramica · ${esc(doc)}</span><span>${String(n).padStart(2, '0')}</span></div>`
const back = (doc) => `<section class="page dark"><div style="position:absolute;top:18mm;left:16mm">${mark(true)}</div>
<div class="over" style="bottom:44mm"><p class="kick">Samples, prices and visits</p><h2 style="font-size:40pt">${esc(EMAIL)}</h2>
<p style="font-size:12pt;line-height:1.5">WhatsApp ${esc(phone)}<br>${ADDRESS.map(esc).join('<br>')}</p></div>
<div class="over" style="bottom:16mm"><p class="demo">${esc(DEMO.company)} ${esc(DEMO.figures)} Interiors are AI-generated for this demo, with Orvane’s rendered surfaces. ${esc(doc)}, ${YEAR}.</p></div></section>`

const formatsOf = (l) => l.formats.map((f) => formatLabel(formatById(f))).join(', ')
const designsIn = (l) => RANGE.filter((d) => d.line === l.id)

/** the line's designs as cards; compact fits up to twelve under the line's facts on one page */
function designGrid(l, compact = true) {
  const ds = designsIn(l)
  const cols = compact || ds.length > 9 ? 'g4' : 'g3'
  const shape = compact ? 'aspect-ratio:1;object-fit:contain' : ds.length > 6 ? 'aspect-ratio:9/10;object-fit:contain' : ''
  return `<div class="grid ${cols}">${ds
    .map(
      (d) => `<figure class="card"><img src="${card(d)}" style="${shape}"><b>${esc(d.name)}</b><span>${esc(d.note)}</span>
<div class="dots">${d.colourways.map((c) => `<i style="background:${c.swatch}"></i>`).join('')}</div></figure>`,
    )
    .join('')}</div>`
}

function lineFacts(l) {
  return `<dl class="facts"><div><dt>Formats, mm</dt><dd>${esc(formatsOf(l))}</dd></div><div><dt>Thickness</dt><dd>${l.thicknesses.join(', ')} mm</dd></div>
<div><dt>Finishes</dt><dd>${l.finishes.map((f) => finishById(f).name).join(', ')}</dd></div><div><dt>For</dt><dd>${l.applications.slice(0, 4).join(', ')}</dd></div></dl>`
}

/* ------------------------------------------------------------------ the documents */

function catalogue() {
  const doc = `Collection ${YEAR}`
  let n = 1
  const pages = []
  const cover = rooms('maesta').find((r) => r.id === 'maesta-portoro-dining') ?? rooms('maesta')[0]
  pages.push(`<section class="page dark scrim"><img class="full" src="${room(cover.id)}"><div class="over" style="top:18mm">${mark(true)}</div>
<div class="over" style="bottom:22mm"><p class="kick">Porcelain slabs from Morbi</p><h1 style="font-size:84pt">Collection<br>${YEAR}</h1>
<p class="lead" style="margin-top:6mm;color:#e9e9e4">${LINES.length} lines, ${RANGE.length} designs, ${RANGE.reduce((a, d) => a + d.colourways.length, 0)} colourways, up to 1800 × 3600 mm.</p></div></section>`)
  n++
  let p = 3
  const toc = LINES.map((l) => {
    const at = p
    p += 2
    return `<div><b>${esc(l.name)}</b><span>${esc(l.kind)}</span><em>${String(at).padStart(2, '0')}</em></div>`
  }).join('')
  pages.push(`<section class="page"><div style="margin-bottom:14mm">${mark()}</div><h2>Eight lines.</h2>
<p class="lead">Each line is made for a place: the largest slabs we press, matched pairs, panels thin enough for a door, kitchens, baths, the outdoors, wood and texture. Every design is printed from a scan of real stone, in up to eight faces so no two slabs in a crate repeat.</p>
<div class="toc">${toc}<div><b>Technical</b><span>Standards, finishes and packing</span><em>${String(p).padStart(2, '0')}</em></div></div>
<p class="demo" style="position:absolute;bottom:20mm;left:16mm">${esc(DEMO.company)} ${esc(DEMO.figures)}</p>${run(doc, n)}</section>`)
  for (const l of LINES) {
    n++
    const r = rooms(l.id)[0]
    pages.push(`<section class="page dark scrim"><img class="full" src="${room(r.id)}">
<div class="over" style="bottom:22mm"><p class="kick">${esc(l.kind)}</p><h1>${esc(l.name)}</h1><p class="lead" style="margin-top:5mm;color:#e9e9e4">${esc(l.tagline)}</p></div>${run(doc, n)}</section>`)
    n++
    pages.push(`<section class="page"><p class="kick">${esc(l.kind)} · ${designsIn(l).length} designs</p><h2>${esc(l.name)}</h2><p style="max-width:150mm">${esc(l.story)}</p>
${lineFacts(l)}${designGrid(l)}${run(doc, n)}</section>`)
  }
  n++
  pages.push(`<section class="page"><p class="kick">Technical</p><h2>Tested to.</h2>
<table><thead><tr><th>Standard</th><th>Test</th><th>Result</th></tr></thead><tbody>${TESTS.map(([a, b, c]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>
<h3 style="margin-top:9mm">Finishes</h3>
<table><thead><tr><th>Finish</th><th>Gloss, 60°</th><th>Slip, DIN 51130</th><th>What it is</th></tr></thead><tbody>${FINISHES.map((f) => `<tr><th>${esc(f.name)}</th><td>${f.gloss} GU</td><td>${f.slip}</td><td>${esc(f.note)}</td></tr>`).join('')}</tbody></table>
<h3 style="margin-top:9mm">Certified</h3><p>${CERTS.map(([c, l]) => `<span class="chip">${esc(c)}, ${esc(l)}</span>`).join('')}</p>
<p class="demo">${esc(DEMO.tests)} ${esc(DEMO.certifications)}</p>${run(doc, n)}</section>`)
  pages.push(back(doc))
  return { file: `orvane-collection-${YEAR}.pdf`, title: `Collection ${YEAR}`, kind: 'Catalogue', about: `All eight lines and ${RANGE.length} designs, with rooms, formats, finishes and the technical data.`, html: shell(doc, pages) }
}

function brochure(l) {
  const doc = `${l.name} brochure`
  const rs = rooms(l.id)
  const pages = [
    `<section class="page dark scrim"><img class="full" src="${room(rs[0].id)}"><div class="over" style="top:18mm">${mark(true)}</div>
<div class="over" style="bottom:22mm"><p class="kick">${esc(l.kind)}</p><h1 style="font-size:92pt">${esc(l.name)}</h1><p class="lead" style="margin-top:6mm;color:#e9e9e4">${esc(l.tagline)}</p></div></section>`,
    `<section class="page"><p class="kick">${esc(l.kind)}</p><h2>${esc(l.tagline)}</h2><p class="lead">${esc(l.story)}</p>${lineFacts(l)}
<h3>Technologies</h3>${l.techs.length ? l.techs.map((t) => `<p><b>${esc(techById(t).name)}</b>, ${esc(techById(t).kind.toLowerCase())}. ${esc(techById(t).claim)}</p>`).join('') : '<p>Full-body porcelain, group BIa.</p>'}
<img class="room" style="height:92mm;margin-top:6mm" src="${room((rs[1] ?? rs[0]).id)}"><p class="demo" style="margin-top:3mm">${esc(DEMO.technology)}</p>${run(doc, 2)}</section>`,
    `<section class="page"><p class="kick">${designsIn(l).length} designs</p><h2>The designs.</h2>${designGrid(l, designsIn(l).length > 9)}${run(doc, 3)}</section>`,
    `<section class="page"><p class="kick">In the houses</p><h2>The rooms.</h2><div class="grid g2">${rs
      .slice(2, 6)
      .map((r) => `<figure class="card" style="margin:0"><img class="room" style="height:62mm" src="${room(r.id)}"><b>${esc(r.room)}</b><span>${esc(r.alt)}</span></figure>`)
      .join('')}</div><p class="demo" style="margin-top:6mm">${esc(DEMO.imagery)}</p>${run(doc, 4)}</section>`,
    back(doc),
  ]
  return { file: `orvane-${l.id}-brochure.pdf`, title: `${l.name}`, kind: 'Line brochure', about: `${l.kind}: ${l.tagline}`, line: l.id, html: shell(doc, pages) }
}

function technical() {
  const doc = `Technical data ${YEAR}`
  const rows = LINES.map(
    (l) =>
      `<tr><th>${esc(l.name)}</th><td>${l.techs.includes('corpo') ? 'Full body' : 'Glazed'}</td><td>${l.thicknesses.join(', ')} mm</td><td>${l.thicknesses
        .map((mm) => `${(mm * 2.35).toFixed(1)}`)
        .join(', ')} kg/m²</td><td>${l.finishes.map((f) => `${finishById(f).name} ${finishById(f).slip}`).join(', ')}</td></tr>`,
  ).join('')
  const pages = [
    `<section class="page"><div style="margin-bottom:12mm">${mark()}</div><p class="kick">Technical data sheet</p><h2>Tested to.</h2>
<p class="lead">The standards a buyer’s specification names, and what the range returns on each. Porcelain of group BIa: water absorption no more than 0.5%, ours under 0.1%.</p>
<table><thead><tr><th>Standard</th><th>Test</th><th>Result</th></tr></thead><tbody>${TESTS.map(([a, b, c]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>
<h3 style="margin-top:9mm">Certified</h3><p>${CERTS.map(([c, l]) => `<span class="chip">${esc(c)}, ${esc(l)}</span>`).join('')}</p>
<p class="demo">${esc(DEMO.tests)} ${esc(DEMO.certifications)}</p>${run(doc, 1)}</section>`,
    `<section class="page"><p class="kick">By line</p><h2>Body, weight and slip.</h2>
<table><thead><tr><th>Line</th><th>Body</th><th>Thickness</th><th>Weight</th><th>Finishes and slip ratings</th></tr></thead><tbody>${rows}</tbody></table>
<h3 style="margin-top:9mm">Thickness and use</h3><table><thead><tr><th>Thickness</th><th>For</th></tr></thead><tbody>${THICKNESSES.map((t) => `<tr><th>${esc(t.label)}</th><td>${esc(t.uses.join(', '))}</td></tr>`).join('')}</tbody></table>
<p class="demo" style="margin-top:6mm">Porcelain weighs about 2.35 kg per m² for each millimetre of thickness. ${esc(DEMO.figures)}</p>${run(doc, 2)}</section>`,
  ]
  return { file: `orvane-technical-data-${YEAR}.pdf`, title: 'Technical data sheet', kind: 'Technical', about: 'Standards and results, certificates, and each line’s body, weight and slip ratings.', html: shell(doc, pages) }
}

function priceList() {
  const doc = `Price list ${YEAR}`
  const sections = LINES.map((l) => {
    const t = mid(l)
    const ds = designsIn(l)
    return `<h3 style="margin-top:7mm">${esc(l.name)} <span style="font-weight:400;color:#6a6a6e">· ${esc(l.kind.toLowerCase())}, ${t} mm</span></h3>
<table><thead><tr><th>Design</th>${l.formats.map((f) => `<th>${esc(formatLabel(formatById(f)))}</th>`).join('')}</tr></thead><tbody>${ds
      .map((d) => `<tr><th>${esc(d.name)}</th>${l.formats.map((f) => `<td>${usd(pricePerM2(d, f, t, d.finish))}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`
  })
  // the first line under the introduction, then two lines to a page
  const pages = [
    `<section class="page"><div style="margin-bottom:10mm">${mark()}</div><p class="kick">Trade price list · sample</p><h2>Prices, ${YEAR}.</h2>
<p class="lead">US dollars per m², FOB Mundra, in each design’s first finish and the line’s middle thickness. A polished Specchio finish adds 8%, carved and leathered 5%, Presa and Grip 3%.</p>${sections[0]}
<p class="demo" style="margin-top:6mm">${esc(DEMO.figures)} Prices are indicative and change with the order; the quotation confirms them.</p>${run(doc, 1)}</section>`,
  ]
  for (let i = 1, n = 2; i < sections.length; i += 2, n++) pages.push(`<section class="page">${sections.slice(i, i + 2).join('')}${run(doc, n)}</section>`)
  return { file: `orvane-price-list-${YEAR}.pdf`, title: 'Trade price list', kind: 'Trade', about: 'Every design in every format, per m² FOB Mundra. Sample prices for a demo company.', html: shell(doc, pages) }
}

function installation() {
  const doc = 'Installation and care'
  const sec = (h, ps) => `<h3>${esc(h)}</h3>${ps.map((x) => `<p>${esc(x)}</p>`).join('')}`
  const pages = [
    `<section class="page dark scrim"><img class="full" src="${room('terme-bianco-shower')}"><div class="over" style="top:18mm">${mark(true)}</div>
<div class="over" style="bottom:22mm"><p class="kick">Guide</p><h1>Installation<br>and care.</h1><p class="lead" style="margin-top:5mm;color:#e9e9e4">Laying large porcelain so it stays flat, matched and easy to keep.</p></div></section>`,
    `<section class="page"><div class="cols">
${sec('Before you lay', ['Check every crate on arrival: the batch, the shade (S1 to S4) and the caliber (C1 to C3) are printed on each. Lay one batch, one shade and one caliber in a room.', 'Slabs printed in sequence are numbered on the back. Lay them in order, and turn every other one for a bookmatch.', 'Let the porcelain stand in the room for a day before laying, and check the floor is flat to within 3 mm under a 2 m straightedge.'])}
${sec('Moving large slabs', ['Carry slabs upright, never flat, on a slab frame or with vacuum lifters: two people for anything up to 1600 × 3200 mm, four beyond.', 'Lift and set down along the long edge; do not let a slab bend across its width.'])}
${sec('Adhesive', ['Use a polymer-modified cementitious adhesive of class C2TE S1 (EN 12004), or S2 for thin panels of 3.5 and 6 mm and for slabs on walls.', 'Spread on the floor with a notched trowel and back-butter every piece over 600 mm, so the adhesive covers at least 95% of the back: no hollow spots, no cracks under load.'])}
${sec('Joints', ['Rectified edges take a joint of 2 mm indoors and 3 mm outdoors. Leave a movement joint round the edges of every room, and across large floors about every 25 m² indoors and 16 m² outdoors.', 'Grout in a tone near the stone: it reads as one surface.'])}
${sec('Cutting and drilling', ['Cut on a wet saw or a rail cutter with a porcelain blade. Start holes at an angle with a diamond core bit, keep it wet, then bring it upright.'])}
</div><img class="room" style="height:78mm;margin-top:5mm" src="${room('maesta-lasa-hall')}"><p class="demo" style="margin-top:4mm">General guidance for a demo company. Follow your local standards and the adhesive maker’s instructions.</p>${run(doc, 2)}</section>`,
    `<section class="page"><div class="cols">
${sec('The first clean', ['A day or two after grouting, take off the cement film with a cleaner made for it, diluted as the maker says, then rinse with clean water.'])}
${sec('Every day', ['A soft mop and a pH-neutral cleaner. Polished Specchio and Glossy faces come up best with a microfibre cloth; avoid waxes and sealers, porcelain does not need them.', 'Wine, coffee, oil and turmeric wipe off with warm water while fresh. Dried stains come off with a neutral cleaner.'])}
${sec('Grip and relief finishes', ['Presa, Grip and Carving keep their grip when they are clean: wash them with a neutral detergent and a soft brush, and rinse.'])}
${sec('Outside', ['Twenty-millimetre porcelain can be laid dry: on grass, on a compacted gravel bed, or on adjustable pedestals over a roof membrane. Brush it down and rinse; a low-pressure washer is fine.', 'Frost does not harm porcelain of group BIa. Clear standing water from pedestal systems in winter.'])}
${sec('Kitchens', ['Hot pans can go straight down on Cucina slabs, and knives will not mark them, but always use a board to keep the knife sharp.'])}
</div><img class="room" style="height:92mm;margin-top:5mm" src="${room('aperto-travertino-pool')}"><p class="demo" style="margin-top:4mm">General guidance for a demo company. ${esc(DEMO.claims)}</p>${run(doc, 3)}</section>`,
    back(doc),
  ]
  return { file: 'orvane-installation-and-care.pdf', title: 'Installation and care', kind: 'Guide', about: 'Checking batches, moving large slabs, adhesive, joints, cutting, cleaning and outdoor laying.', html: shell(doc, pages) }
}

function packing() {
  const doc = 'Packing and containers'
  const PAYLOAD = 24000
  const rows = LINES.flatMap((l) =>
    l.formats.map((f) => {
      const d = designsIn(l)[0]
      const t = mid(l)
      const s = specFor(d, f, t, d.finish)
      const per = Math.floor(PAYLOAD / s.packing.kg)
      return `<tr><th>${esc(l.name)}</th><td>${esc(formatLabel(formatById(f)))}</td><td>${t} mm</td><td>${s.packing.pieces} a ${s.packing.unit}</td><td>${s.packing.m2.toFixed(2)} m²</td><td>${Math.round(s.packing.kg)} kg</td><td>${per} ${s.packing.unit === 'box' ? 'boxes' : 'crates'}, ${Math.round(per * s.packing.m2)} m²</td></tr>`
    }),
  )
  const half = Math.ceil(rows.length / 2)
  const head = `<thead><tr><th>Line</th><th>Format</th><th>Thickness</th><th>Packing</th><th>Area</th><th>Weight</th><th>A 20 ft container</th></tr></thead>`
  const pages = [
    `<section class="page"><div style="margin-bottom:10mm">${mark()}</div><p class="kick">Packing and containers</p><h2>What fits.</h2>
<p class="lead">Tiles fill a container by weight before they fill it by volume, so a 20 ft container is loaded to about 24 tonnes. Slabs travel upright in A-frame crates, tiles in boxes on pallets.</p>
<table>${head}<tbody>${rows.slice(0, half).join('')}</tbody></table>${run(doc, 1)}</section>`,
    `<section class="page"><table>${head}<tbody>${rows.slice(half).join('')}</tbody></table>
<p class="demo" style="margin-top:6mm">Figures computed from 2.35 kg per m² per mm of thickness and a 24 t payload. ${esc(DEMO.figures)} The packing list on each order confirms the load.</p>${run(doc, 2)}</section>`,
  ]
  return { file: 'orvane-packing-and-containers.pdf', title: 'Packing and containers', kind: 'Guide', about: 'Pieces, area and weight per box or crate, and what a 20 ft container holds, for every line and format.', html: shell(doc, pages) }
}

/* ------------------------------------------------------------------ print */

const docs = [catalogue(), ...LINES.map(brochure), technical(), priceList(), installation(), packing()].filter((d) => !only || only.split(',').some((o) => d.file.includes(o)))

mkdirSync(join(OUT, 'thumbs'), { recursive: true })
const tmp = mkdtempSync(join(tmpdir(), 'pdf-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9336', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pdfc-'))}`, 'about:blank',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let targets
for (let i = 0; i < 60; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9336/json')).json()
    if (targets.length) break
  } catch {}
  await sleep(200)
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d)
    pending.delete(d.id)
  }
}
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const js = async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable')
await send('Runtime.enable')

const manifest = []
const old = (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'src/data/downloads.json'), 'utf8'))
  } catch {
    return []
  }
})()
for (const d of docs) {
  const t0 = Date.now()
  const file = join(tmp, d.file.replace('.pdf', '.html'))
  writeFileSync(file, d.html)
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 2, mobile: false })
  await send('Page.navigate', { url: pathToFileURL(file).href })
  // fonts and every picture in, before printing
  for (let i = 0; i < 300; i++) {
    await sleep(100)
    if (await js(`document.readyState === 'complete' && [...document.images].every((i) => i.complete) && document.fonts.status === 'loaded'`)) break
  }
  await sleep(300)
  const pages = await js(`document.querySelectorAll('.page').length`)
  const pdf = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true })
  writeFileSync(join(OUT, d.file), Buffer.from(pdf.result.data, 'base64'))
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 794, height: 1123, scale: 0.6 } })
  const thumb = `thumbs/${d.file.replace('.pdf', '.jpg')}`
  writeFileSync(join(OUT, thumb), Buffer.from(shot.result.data, 'base64'))
  // PREVIEW=dir saves every page as a picture, for checking the layout without a PDF viewer
  if (process.env.PREVIEW) {
    mkdirSync(process.env.PREVIEW, { recursive: true })
    const tops = await js(`[...document.querySelectorAll('.page')].map((p) => p.getBoundingClientRect().top + scrollY)`)
    for (const [i, top] of tops.entries()) {
      const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: top, width: 794, height: 1123, scale: 0.5 } })
      writeFileSync(join(process.env.PREVIEW, `${d.file.replace('.pdf', '')}-${String(i + 1).padStart(2, '0')}.jpg`), Buffer.from(s.result.data, 'base64'))
    }
  }
  const bytes = statSync(join(OUT, d.file)).size
  manifest.push({ file: d.file, thumb, title: d.title, kind: d.kind, about: d.about, line: d.line, pages, bytes })
  console.log(`${d.file}  ${pages} pages  ${(bytes / 1e6).toFixed(1)} MB  ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}
// keep the documents this run did not make
const merged = [...manifest, ...old.filter((o) => !manifest.some((m) => m.file === o.file))]
const order = ['Catalogue', 'Line brochure', 'Technical', 'Trade', 'Guide']
merged.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
writeFileSync(join(ROOT, 'src/data/downloads.json'), JSON.stringify(merged, null, 2) + '\n')
ws.close()
chrome.kill()
