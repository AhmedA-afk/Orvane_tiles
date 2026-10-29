import { designById, formatById, formatLabel, lineById, tileUrl } from '../data/range'
import { loadImage } from '../studio/paint'
import type { Season } from './data'

// Drawing a season's marketing kit in a dealer's name, on canvas: square
// posts in three layouts, a vertical reel (drawn frame by frame, so it can be
// previewed live and recorded to video), a WhatsApp catalogue card, and a
// printable brochure. Everything is made in the browser from the range's own
// pictures; nothing is sent anywhere.

export interface Shop {
  name: string
  city: string
  phone: string
}

const INK = '#0b0b0c'
const PAPER = '#f1f1ee'
const FONT = 'Geist, ui-sans-serif, system-ui, sans-serif'

const room = (id: string) => `/images/interiors/${id}.jpg`

export async function fontsReady() {
  await Promise.all([document.fonts.load(`600 64px ${FONT}`), document.fonts.load(`400 32px ${FONT}`)]).catch(() => {})
}

/** draws an image to cover a box, cropped from its centre, scaled by `zoom` */
function cover(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, zoom = 1, shiftX = 0.5) {
  const s = Math.max(w / img.width, h / img.height) * zoom
  const sw = w / s
  const sh = h / s
  g.drawImage(img, (img.width - sw) * shiftX, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

/** sets text in lines no wider than `w`, from (x, y) down; returns the y after the last line */
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, lh: number) {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const t = line ? `${line} ${word}` : word
    if (g.measureText(t).width > w && line) {
      g.fillText(line, x, y)
      line = word
      y += lh
    } else line = t
  }
  if (line) g.fillText(line, x, y)
  return y + lh
}

/** the Orvane slab mark and name, small */
function mark(g: CanvasRenderingContext2D, x: number, y: number, colour: string, size = 30) {
  g.strokeStyle = colour
  g.lineWidth = size * 0.08
  g.strokeRect(x, y - size * 0.82, size * 0.42, size * 0.84)
  g.fillStyle = colour
  g.font = `600 ${size}px ${FONT}`
  g.fillText('Orvane', x + size * 0.62, y)
}

function scrim(g: CanvasRenderingContext2D, y0: number, y1: number, w: number, a = 0.62) {
  const grad = g.createLinearGradient(0, y0, 0, y1)
  grad.addColorStop(0, 'rgba(5,5,6,0)')
  grad.addColorStop(1, `rgba(5,5,6,${a})`)
  g.fillStyle = grad
  g.fillRect(0, y0, w, y1 - y0)
}

/** one of three square posts for the season, 1080 × 1080 */
export async function drawPost(c: HTMLCanvasElement, s: Season, shop: Shop, layout: number) {
  await fontsReady()
  c.width = c.height = 1080
  const g = c.getContext('2d')!
  g.textBaseline = 'alphabetic'
  const d = designById(s.designs[layout % s.designs.length])!
  if (layout === 0) {
    cover(g, await loadImage(room(s.rooms[0])), 0, 0, 1080, 1080, 1.02)
    scrim(g, 520, 1080, 1080, 0.7)
    mark(g, 64, 112, PAPER)
    g.fillStyle = PAPER
    g.font = `600 92px ${FONT}`
    const y = wrap(g, s.headline, 64, 812, 900, 92)
    g.font = `400 34px ${FONT}`
    g.fillText(`${shop.name}, ${shop.city} · ${shop.phone}`, 64, y + 6)
  } else if (layout === 1) {
    cover(g, await loadImage(tileUrl(d.colourways[0].file)), 0, 0, 1080, 1080, 1.4)
    g.fillStyle = PAPER
    g.fillRect(0, 700, 1080, 380)
    g.fillStyle = INK
    g.font = `400 30px ${FONT}`
    g.fillText(`${lineById(d.line).name} · ${formatLabel(formatById(lineById(d.line).hero)!)} mm`, 64, 772)
    g.font = `600 88px ${FONT}`
    g.fillText(d.name, 64, 868)
    g.font = `400 34px ${FONT}`
    g.fillText(`Now at ${shop.name}, ${shop.city}`, 64, 948)
    g.fillText(shop.phone, 64, 1000)
    mark(g, 64, 112, PAPER)
  } else {
    cover(g, await loadImage(room(s.rooms[1] ?? s.rooms[0])), 0, 0, 540, 1080, 1, 0.4)
    g.fillStyle = PAPER
    g.fillRect(540, 0, 540, 1080)
    mark(g, 600, 112, INK)
    g.fillStyle = INK
    g.font = `600 70px ${FONT}`
    const y = wrap(g, s.headline, 600, 290, 420, 74)
    let yy = y + 40
    for (const id of s.designs.slice(0, 3)) {
      const x = designById(id)!
      cover(g, await loadImage(tileUrl(x.colourways[0].sm)), 600, yy - 52, 64, 64, 1.6)
      g.fillStyle = INK
      g.font = `500 34px ${FONT}`
      g.fillText(x.name, 690, yy - 8)
      yy += 92
    }
    g.font = `600 34px ${FONT}`
    g.fillText(shop.name, 600, 960)
    g.font = `400 30px ${FONT}`
    g.fillText(`${shop.city} · ${shop.phone}`, 600, 1008)
  }
}

/* ------------------------------------------------------------------ the reel */

export const REEL_SECONDS = 9

/** the reel's pictures, loaded once */
export async function reelImages(s: Season) {
  await fontsReady()
  return Promise.all([...s.rooms.slice(0, 2).map((r) => loadImage(room(r))), ...s.designs.slice(0, 3).map((id) => loadImage(tileUrl(designById(id)!.colourways[0].sm)))])
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

/** one frame of the vertical reel, at `t` seconds: two rooms, three stones, then the shop */
export function drawReel(g: CanvasRenderingContext2D, imgs: HTMLImageElement[], s: Season, shop: Shop, t: number, W = 1080, H = 1920) {
  const k = W / 1080
  g.textBaseline = 'alphabetic'
  g.fillStyle = PAPER
  g.fillRect(0, 0, W, H)
  const scene = (i: number, from: number, to: number) => {
    const p = (t - from) / (to - from)
    if (p < -0.15 || p > 1.15) return
    g.globalAlpha = Math.min(1, ease((t - from + 0.4) / 0.4), ease((to + 0.4 - t) / 0.4))
    cover(g, imgs[i], 0, 0, W, H, 1.18 - 0.12 * p, 0.5)
    g.globalAlpha = 1
  }
  scene(0, 0, 3.2)
  scene(1, 3, 6.2)
  if (t < 6.2) {
    scrim(g, H * 0.5, H, W, 0.72)
    mark(g, 72 * k, 140 * k, PAPER, 40 * k)
    g.fillStyle = PAPER
    const rise = (from: number) => (1 - ease((t - from) / 0.7)) * 60 * k
    if (t < 3.1) {
      g.globalAlpha = ease((t - 0.4) / 0.6)
      g.font = `600 ${118 * k}px ${FONT}`
      wrap(g, s.headline, 72 * k, H - 520 * k + rise(0.4), W - 144 * k, 120 * k)
    } else {
      g.globalAlpha = ease((t - 3.4) / 0.6)
      g.font = `400 ${40 * k}px ${FONT}`
      g.fillText(`${lineById(s.line).name}, in ${s.designs.length} designs`, 72 * k, H - 560 * k + rise(3.4))
      g.font = `600 ${64 * k}px ${FONT}`
      s.designs.slice(0, 4).forEach((id, i) => {
        g.globalAlpha = ease((t - 3.6 - i * 0.25) / 0.5)
        g.fillText(designById(id)!.name, 72 * k, H - 460 * k + i * 84 * k + rise(3.6 + i * 0.25))
      })
    }
    g.globalAlpha = 1
  }
  if (t >= 6) {
    // the end card: the stones as three tall swatches, and the shop
    g.globalAlpha = ease((t - 6) / 0.5)
    g.fillStyle = PAPER
    g.fillRect(0, 0, W, H)
    imgs.slice(2).forEach((im, i) => {
      const x = 72 * k + i * ((W - 144 * k) / 3)
      cover(g, im, x + 6 * k, 260 * k + (1 - ease((t - 6.1 - i * 0.12) / 0.6)) * 80 * k, (W - 144 * k) / 3 - 12 * k, 760 * k, 1.2)
    })
    g.fillStyle = INK
    g.font = `400 ${40 * k}px ${FONT}`
    g.fillText('Now in our showroom', 72 * k, 1180 * k)
    g.font = `600 ${92 * k}px ${FONT}`
    const y = wrap(g, shop.name, 72 * k, 1290 * k, W - 144 * k, 96 * k)
    g.font = `400 ${46 * k}px ${FONT}`
    g.fillText(shop.city, 72 * k, y + 10 * k)
    g.fillText(shop.phone, 72 * k, y + 72 * k)
    mark(g, 72 * k, H - 110 * k, INK, 38 * k)
    g.font = `400 ${30 * k}px ${FONT}`
    g.fillText('Tiles by Orvane, made in Morbi', 300 * k, H - 112 * k)
    g.globalAlpha = 1
  }
}

/** records the reel to a video file, in real time: about nine seconds */
export async function recordReel(s: Season, shop: Shop, onProgress: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const imgs = await reelImages(s)
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  const g = c.getContext('2d')!
  drawReel(g, imgs, s, shop, 0)
  const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
  const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 8_000_000 })
  const parts: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
  const done = new Promise<void>((ok) => (rec.onstop = () => ok()))
  rec.start(250)
  const t0 = performance.now()
  await new Promise<void>((ok) => {
    const frame = () => {
      const t = (performance.now() - t0) / 1000
      drawReel(g, imgs, s, shop, Math.min(t, REEL_SECONDS))
      onProgress(Math.min(1, t / REEL_SECONDS))
      if (t < REEL_SECONDS) requestAnimationFrame(frame)
      else ok()
    }
    requestAnimationFrame(frame)
  })
  rec.stop()
  await done
  return { blob: new Blob(parts, { type: type.split(';')[0] }), ext: type.includes('mp4') ? 'mp4' : 'webm' }
}

/* ------------------------------------------------------------------ the WhatsApp catalogue */

/** a tall card listing the season's stones, for sending on WhatsApp, 1080 × 1920 */
export async function drawCatalogue(c: HTMLCanvasElement, s: Season, shop: Shop) {
  await fontsReady()
  c.width = 1080
  c.height = 1920
  const g = c.getContext('2d')!
  g.fillStyle = PAPER
  g.fillRect(0, 0, 1080, 1920)
  mark(g, 72, 130, INK, 36)
  g.fillStyle = INK
  g.font = `600 76px ${FONT}`
  const y0 = wrap(g, s.headline, 72, 270, 936, 80)
  g.font = `400 34px ${FONT}`
  g.fillText(`${s.name} · ${lineById(s.line).name}`, 72, y0 + 4)
  const top = y0 + 70
  const cw = (1080 - 144 - 40) / 2
  const ch = 300
  for (let i = 0; i < 6; i++) {
    const d = designById(s.designs[i])
    if (!d) continue
    const x = 72 + (i % 2) * (cw + 40)
    const y = top + Math.floor(i / 2) * (ch + 120)
    cover(g, await loadImage(tileUrl(d.colourways[0].sm)), x, y, cw, ch, 1.1)
    g.fillStyle = INK
    g.font = `600 38px ${FONT}`
    g.fillText(d.name, x, y + ch + 50)
    g.font = `400 28px ${FONT}`
    g.fillText(lineById(d.line).formats.map((f) => formatLabel(formatById(f)!)).slice(-2).join(', ') + ' mm', x, y + ch + 90)
  }
  g.fillStyle = INK
  g.fillRect(0, 1700, 1080, 220)
  g.fillStyle = PAPER
  g.font = `600 48px ${FONT}`
  g.fillText(shop.name, 72, 1790)
  g.font = `400 34px ${FONT}`
  g.fillText(`${shop.city} · ${shop.phone}`, 72, 1850)
}

export function catalogueMessage(s: Season, shop: Shop) {
  return [
    `${s.headline} New this season at ${shop.name}, ${shop.city}:`,
    ...s.designs.map((id) => {
      const d = designById(id)!
      return `• ${d.name}, ${lineById(d.line).name}`
    }),
    `Visit us or reply here for prices and a sample. ${shop.phone}`,
  ].join('\n')
}

/* ------------------------------------------------------------------ the brochure */

const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)

/** a four-page brochure in the dealer's name, opened for printing (or saving as a PDF) */
export function printBrochure(s: Season, shop: Shop) {
  const o = location.origin
  const L = lineById(s.line)
  const designs = s.designs.map((id) => designById(id)!).filter(Boolean)
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(s.name)}, ${esc(shop.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Geist,system-ui,sans-serif;color:#0b0b0c;background:#f1f1ee}
.page{width:210mm;height:297mm;padding:16mm;position:relative;overflow:hidden;page-break-after:always;background:#f1f1ee}
.cover{padding:0;color:#f1f1ee}.cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover .t{position:absolute;left:16mm;right:16mm;bottom:20mm}.cover:after{content:"";position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(5,5,6,.72))}
.cover .t{z-index:1}.mark{font-weight:600;font-size:16px;letter-spacing:-.02em;position:absolute;top:16mm;left:16mm;z-index:1}
h1{font-size:64px;line-height:.92;letter-spacing:-.05em;margin:0 0 6mm;font-weight:600}h2{font-size:34px;letter-spacing:-.04em;margin:0 0 6mm;font-weight:600}
p{font-size:13px;line-height:1.55;margin:0 0 4mm;max-width:120mm}.small{font-size:10px;color:#6a6a6e}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.grid figure{margin:0}.grid img{width:100%;height:62mm;object-fit:cover;border-radius:2mm}
.grid b{display:block;font-size:13px;margin-top:2mm}.grid span{font-size:10px;color:#6a6a6e}
.room{width:100%;height:120mm;object-fit:cover;border-radius:2mm;margin-bottom:6mm}
.back{display:flex;flex-direction:column;justify-content:space-between}.shop{font-size:44px;font-weight:600;letter-spacing:-.04em;line-height:1}
</style></head><body>
<section class="page cover"><img src="${o}/images/interiors/${s.rooms[0]}.jpg"><div class="mark">Orvane · ${esc(shop.name)}</div>
<div class="t"><p class="small" style="color:#d9d9d4">${esc(s.name)} · ${esc(L.name)}</p><h1>${esc(s.headline)}</h1><p>${esc(L.story)}</p></div></section>
<section class="page"><h2>${designs.length} designs, in stock at ${esc(shop.name)}</h2><p>${esc(L.tagline)} ${esc(L.kind)}, in ${esc(L.formats.map((f) => formatLabel(formatById(f)!)).join(', '))} mm and ${esc(L.thicknesses.join(', '))} mm.</p>
<div class="grid">${designs.map((d) => `<figure><img src="${o}${tileUrl(d.colourways[0].sm)}"><b>${esc(d.name)}</b><span>${esc(d.note)}</span></figure>`).join('')}</div></section>
<section class="page"><h2>In the room</h2>${s.rooms.slice(1, 3).map((r) => `<img class="room" src="${o}/images/interiors/${r}.jpg">`).join('')}<p class="small">Interiors are AI-generated for this demo, with Orvane’s rendered surfaces.</p></section>
<section class="page back"><div><div class="small">Visit us</div><div class="shop">${esc(shop.name)}</div><p style="font-size:18px;margin-top:6mm">${esc(shop.city)}<br>${esc(shop.phone)}</p></div>
<div><p class="small">Tiles by Orvane Ceramica, pressed and fired in Morbi. Orvane Ceramica is a fictional company. This brochure is a demo, and nothing in it is for sale.</p></div></section>
<script>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))]).then(()=>setTimeout(()=>print(),300))</script>
</body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
