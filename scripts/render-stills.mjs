// Renders the site's stills from the live 3D scenes in render.html.
//   node scripts/render-stills.mjs [filter]      (dev server on :3000)
// Each job opens /render.html with its scene, waits for window.__ready and
// saves a JPEG to public/renders/. Needs Google Chrome.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const BASE = process.env.RENDER_BASE ?? 'http://localhost:3000'
const OUT = 'public/renders'
const only = process.argv[2]

// the dark scenes sit on a neutral near-black; the portraits on a warm or cool one, after their stone
const GROUND = '#0c0c0d'
export const FIELDS = {
  onice: '#101110',
  travertino: '#14120f',
}
const ALL = ['statuario', 'calacatta', 'onice', 'nero', 'armani', 'travertino', 'crema', 'ivory', 'pepper', 'cemento', 'terrazzo', 'rovere', 'teak', 'pietra', 'bardiglio']

import { LINES } from '../src/data/range/lines.ts'
const LIGHT = '#f1f1ee'
// each line's finishes, on its feature design
const FINISH_SAMPLES = LINES.flatMap((l) =>
  l.finishes.map((f) => ({ name: `finish/${l.id}--${f}`, scene: 'finish', design: l.feature, extra: `&finish=${f}`, bg: '#e8e8e4', w: 900, h: 900, exp: 1.1 })),
)
// the range: every design in every colourway, from the catalogue
const RANGE_CARDS = (() => {
  const man = JSON.parse(readFileSync(new URL('../src/data/range/swatches.json', import.meta.url), 'utf8'))
  return Object.entries(man).flatMap(([id, e]) =>
    e.colourways.map((c) => ({ name: `range/${id}--${c.slug}`, scene: 'piece', design: id, extra: `&cw=${c.slug}`, bg: '#e8e8e4', w: 720, h: 960, exp: 1.15 })),
  )
})()
// the cards sit on the catalogue's card tone (--bg-2)
const CARD = '#e8e8e4'
// the showcase pages: a slab that towers, the same slab edge-on, and one dark
// stone in every finish for the surface lab's gloss bench
const SHOWCASE = [
  { name: 'show/tower-portoro', scene: 'tall', design: 'portoro', bg: LIGHT, w: 1400, h: 2100, exp: 0.92, extra: '&format=1800x3600&mm=12&ry=-0.34&rz=0.035&key=0.6' },
  { name: 'show/turn-portoro', scene: 'tall', design: 'portoro', bg: LIGHT, w: 1400, h: 2100, exp: 0.92, extra: '&format=1800x3600&mm=12&ry=0.62&rz=-0.03&key=-0.6' },
  ...['specchio', 'glossy', 'satin', 'matt', 'carving', 'pelle', 'presa', 'grip'].map((f) => ({
    name: `show/lab-${f}`, scene: 'finish', design: 'nero', bg: '#0b0b0c', w: 1200, h: 1200, exp: 1.1, extra: `&finish=${f}&dark=1`,
  })),
]
const jobs = [
  ...SHOWCASE,
  ...RANGE_CARDS,
  ...FINISH_SAMPLES,
  ...ALL.map((d) => ({ name: `card-${d}`, scene: 'card', design: d, bg: CARD, w: 720, h: 960, exp: 1.15 })),
  { name: 'hero-light', scene: 'hero-light', design: 'calacatta', bg: LIGHT, w: 2560, h: 1440, exp: 1.15 },
  ...Object.entries(FIELDS).map(([d, bg]) => ({ name: `portrait-${d}`, scene: 'portrait', design: d, bg, w: 1080, h: 1440 })),
  { name: 'room-day', scene: 'room-pt', design: process.env.FLOOR ?? 'nero', bg: '#f1f1ee', w: 2560, h: 1440, wait: 15000, samples: Number(process.env.SAMPLES ?? 500), exp: 0.5 },
  { name: 'kiln', scene: 'kiln', design: 'statuario', bg: GROUND, w: 2400, h: 1350 },
  { name: 'row', scene: 'row', design: 'statuario', bg: GROUND, w: 2400, h: 1350 },
  { name: 'stack', scene: 'stack', design: 'statuario', bg: GROUND, w: 1080, h: 1440 },
  { name: 'polish', scene: 'polish', design: 'statuario', bg: GROUND, w: 1200, h: 1200 },
  { name: 'rack', scene: 'rack', design: 'statuario', bg: GROUND, w: 1920, h: 1200 },
].filter((j) => !only || only.split(',').some((o) => j.name.includes(o)))

mkdirSync(OUT, { recursive: true })
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9334', '--no-first-run', '--hide-scrollbars',
  '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'render-'))}`, 'about:blank',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let targets
for (let i = 0; i < 60; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9334/json')).json()
    if (targets.length) break
  } catch {}
  await sleep(200)
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
const logs = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d)
    pending.delete(d.id)
  }
  if (d.method === 'Runtime.exceptionThrown') logs.push(d.params.exceptionDetails.exception?.description)
}
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
await send('Runtime.enable')
await send('Page.enable')

for (const j of jobs) {
  const t0 = Date.now()
  await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: false })
  const url = `${BASE}/render.html?scene=${j.scene}&design=${j.design}&bg=${encodeURIComponent(j.bg)}${j.samples ? `&samples=${j.samples}` : ''}${j.exp ? `&exp=${j.exp}` : ''}${process.env.KEY ? `&key=${process.env.KEY}` : ''}${j.extra ?? ''}`
  await send('Page.navigate', { url })
  let ok = false
  for (let i = 0; i < (j.wait ?? 600) && !ok; i++) {
    await sleep(100)
    const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true })
    ok = r.result?.result?.value === true
  }
  if (!ok) {
    // a path-traced still keeps what it has rendered so far rather than nothing
    const n = (await send('Runtime.evaluate', { expression: 'window.__samples ?? 0', returnByValue: true })).result?.result?.value
    console.log(`TIMEOUT ${j.name}${j.samples ? ` at ${n} samples` : ''}`, logs.splice(0).join(' | '))
    if (!j.samples || !n) continue
  }
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 })
  mkdirSync(dirname(join(OUT, `${j.name}.jpg`)), { recursive: true })
  writeFileSync(join(OUT, `${j.name}.jpg`), Buffer.from(shot.result.data, 'base64'))
  console.log(`${j.name}  ${j.w}×${j.h}  ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}
if (logs.length) console.log('errors:', logs.join('\n'))
ws.close()
chrome.kill()
