import { useMemo, useState } from 'react'
import type { Format } from '../data/range'

// Cut to size: the pieces a job needs, nested on one slab. It tries the
// pieces both ways round, leaves a saw kerf between them, and reports how
// many come from a slab, the yield, the offcut and the slabs for the job.

const KERF = 4 // mm, the saw blade

const PRESETS: { label: string; w: number; h: number; n: number }[] = [
  { label: 'Kitchen counter', w: 3000, h: 650, n: 2 },
  { label: 'Island top', w: 2400, h: 1000, n: 1 },
  { label: 'Vanity top', w: 1200, h: 550, n: 2 },
  { label: 'Splashback', w: 3000, h: 600, n: 1 },
  { label: 'Dining table', w: 2200, h: 1000, n: 1 },
  { label: 'Stair tread', w: 1200, h: 350, n: 14 },
]

function nest(slabW: number, slabH: number, w: number, h: number) {
  const fit = (pw: number, ph: number) => {
    const cols = Math.floor((slabW + KERF) / (pw + KERF))
    const rows = Math.floor((slabH + KERF) / (ph + KERF))
    return { cols, rows, n: Math.max(0, cols) * Math.max(0, rows), pw, ph }
  }
  const a = fit(w, h)
  const b = fit(h, w)
  return b.n > a.n ? b : a
}

export function CutPlanner({ slab, image }: { slab: Format; image: string }) {
  const [w, setW] = useState(3000)
  const [h, setH] = useState(650)
  const [count, setCount] = useState(2)
  // the slab lies long side across: x along its length, y along its width
  const r = useMemo(() => nest(slab.h, slab.w, w, h), [slab, w, h])
  const used = (r.n * w * h) / (slab.w * slab.h)
  const slabs = r.n ? Math.ceil(count / r.n) : 0
  const offcut = ((slab.w * slab.h - r.n * w * h) / 1e6) * (slabs || 1)
  // the drawing: the slab lying long side across
  const S = 0.16 // px per mm
  const vw = slab.h * S
  const vh = slab.w * S
  const clamp = (v: number) => Math.max(50, Math.min(Math.max(slab.w, slab.h), Math.round(v) || 0))

  return (
    <div className="cut">
      <div className="cut-form">
        <div className="chips" role="radiogroup" aria-label="Presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              role="radio"
              aria-checked={p.w === w && p.h === h && p.n === count}
              onClick={() => {
                setW(p.w)
                setH(p.h)
                setCount(p.n)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="cut-inputs">
          <label>
            <span className="mono">Length, mm</span>
            <input inputMode="numeric" value={w} onChange={(e) => setW(clamp(Number(e.target.value)))} />
          </label>
          <label>
            <span className="mono">Width, mm</span>
            <input inputMode="numeric" value={h} onChange={(e) => setH(clamp(Number(e.target.value)))} />
          </label>
          <label>
            <span className="mono">Pieces</span>
            <input inputMode="numeric" value={count} onChange={(e) => setCount(Math.max(1, Math.min(99, Math.round(Number(e.target.value)) || 1)))} />
          </label>
        </div>
        <dl className="cut-stats" aria-live="polite">
          <div>
            <dt>per slab</dt>
            <dd>{r.n}</dd>
          </div>
          <div>
            <dt>yield</dt>
            <dd>{Math.round(used * 100)}%</dd>
          </div>
          <div>
            <dt>slabs for the job</dt>
            <dd>{slabs || '—'}</dd>
          </div>
          <div>
            <dt>offcut</dt>
            <dd>{r.n ? `${offcut.toFixed(2)} m²` : '—'}</dd>
          </div>
        </dl>
        {!r.n && <p className="cut-note">That piece is larger than a {slab.w} × {slab.h} mm slab.</p>}
      </div>
      <svg className="cut-svg" viewBox={`-8 -8 ${vw + 16} ${vh + 16}`} role="img" aria-label={`${r.n} pieces of ${w} by ${h} millimetres nested on one slab`}>
        <defs>
          <pattern id="cut-stone" patternUnits="userSpaceOnUse" width={vw} height={vh}>
            <image href={image} width={vh} height={vw} preserveAspectRatio="none" transform={`translate(0 ${vh}) rotate(-90)`} />
          </pattern>
          <pattern id="cut-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          </pattern>
        </defs>
        <rect width={vw} height={vh} rx="3" fill="url(#cut-hatch)" stroke="currentColor" strokeOpacity="0.3" />
        {Array.from({ length: r.n }, (_, i) => {
          const c = i % r.cols
          const row = Math.floor(i / r.cols)
          return (
            <rect
              key={i}
              x={c * (r.pw + KERF) * S}
              y={row * (r.ph + KERF) * S}
              width={r.pw * S}
              height={r.ph * S}
              fill="url(#cut-stone)"
              stroke="#0b0b0c"
              strokeWidth="1.2"
            />
          )
        })}
        <text x={vw / 2} y={vh + 6} className="cut-dim" textAnchor="middle" dominantBaseline="hanging">
          {slab.h} mm
        </text>
      </svg>
    </div>
  )
}
