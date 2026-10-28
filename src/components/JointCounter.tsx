import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import { formatById, formatLabel, type Format } from '../data/range'
import { AnimatedNumber } from './AnimatedNumber'

// Count the joints: a room's floor laid in a small tile and in the largest
// slab, drawn in plan with its grout lines, and the pieces and metres of joint
// each takes. Each format is tried both ways round; the layout with fewer
// pieces (then fewer joints) wins, as a fitter would choose.

const ROOMS = [
  { label: 'Bathroom', w: 2400, l: 1800 },
  { label: 'Living room', w: 5400, l: 3600 },
  { label: 'Hotel lobby', w: 9000, l: 7200 },
]

const FORMATS = ['600x600', '1200x1200', '1200x2400', '1800x3600'].map((id) => formatById(id)!)
const BASE = FORMATS[0]

function lay(W: number, L: number, f: Format) {
  const opt = (fw: number, fh: number) => {
    const cols = Math.ceil(W / fw - 1e-6)
    const rows = Math.ceil(L / fh - 1e-6)
    return { cols, rows, fw, fh, n: cols * rows, joints: ((cols - 1) * L + (rows - 1) * W) / 1000 }
  }
  const a = opt(f.w, f.h)
  const b = opt(f.h, f.w)
  return b.n < a.n || (b.n === a.n && b.joints < a.joints) ? b : a
}

const m = (mm: number) => (mm / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })

export function JointCounter({ stone = '/tiles/portoro.webp', start = 1 }: { stone?: string; start?: number }) {
  const [w, setW] = useState(ROOMS[start].w)
  const [l, setL] = useState(ROOMS[start].l)
  const [fi, setFi] = useState(FORMATS.length - 1)
  const f = FORMATS[fi]
  const r = useMemo(() => lay(w, l, f), [w, l, f])
  const base = useMemo(() => lay(w, l, BASE), [w, l])
  const fewer = base.joints ? Math.round((1 - r.joints / base.joints) * 100) : 0
  const pat = useId().replace(/:/g, '')
  const preset = ROOMS.findIndex((x) => x.w === w && x.l === l)

  return (
    <div className="jc">
      <div className="jc-controls">
        <div className="jc-group">
          <p className="jc-label">The room</p>
          <div className="chips" role="radiogroup" aria-label="Room">
            {ROOMS.map((x, i) => (
              <button
                key={x.label}
                role="radio"
                aria-checked={i === preset}
                onClick={() => {
                  setW(x.w)
                  setL(x.l)
                }}
                data-cursor="hover"
              >
                {x.label}
              </button>
            ))}
          </div>
          <label className="jc-range">
            <span>Width</span>
            <input type="range" min={1200} max={12000} step={300} value={w} onChange={(e) => setW(+e.target.value)} />
            <b className="num">{m(w)} m</b>
          </label>
          <label className="jc-range">
            <span>Length</span>
            <input type="range" min={1200} max={12000} step={300} value={l} onChange={(e) => setL(+e.target.value)} />
            <b className="num">{m(l)} m</b>
          </label>
        </div>
        <div className="jc-group">
          <p className="jc-label">Laid in</p>
          <div className="chips" role="radiogroup" aria-label="Format">
            {FORMATS.map((x, i) => (
              <button key={x.id} role="radio" aria-checked={i === fi} onClick={() => setFi(i)} data-cursor="hover">
                {formatLabel(x)}
              </button>
            ))}
          </div>
        </div>
        <dl className="jc-out">
          <div>
            <dt>{r.n === 1 ? 'piece' : 'pieces'}</dt>
            <dd>
              <AnimatedNumber value={r.n} format={(n) => String(Math.round(n))} />
            </dd>
          </div>
          <div>
            <dt>metres of joint</dt>
            <dd>
              <AnimatedNumber value={r.joints} format={(n) => n.toFixed(1)} />
            </dd>
          </div>
          <p className="jc-vs" aria-live="polite">
            {fi === 0
              ? `${base.n} tiles of ${formatLabel(BASE)} mm: the floor most rooms get.`
              : `${fewer}% less joint than ${base.n} tiles of ${formatLabel(BASE)} mm, which leave ${base.joints.toFixed(1)} m.`}
          </p>
        </dl>
      </div>

      <figure className="jc-plan">
        <svg viewBox={`0 0 ${w} ${l}`} role="img" aria-label={`A ${m(w)} by ${m(l)} metre floor in ${formatLabel(f)} mm: ${r.n} pieces and ${r.joints.toFixed(1)} metres of joint`}>
          <defs>
            <pattern id={pat} patternUnits="userSpaceOnUse" width={1800} height={3600}>
              <image href={stone} width={1800} height={3600} preserveAspectRatio="none" />
            </pattern>
          </defs>
          <rect width={w} height={l} fill={`url(#${pat})`} />
          <AnimatePresence initial={false}>
            {Array.from({ length: r.cols - 1 }, (_, i) => (
              <motion.line
                key={`x${(i + 1) * r.fw}`}
                x1={(i + 1) * r.fw}
                x2={(i + 1) * r.fw}
                y1={0}
                y2={l}
                className="jc-joint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.01 }}
              />
            ))}
            {Array.from({ length: r.rows - 1 }, (_, i) => (
              <motion.line
                key={`y${(i + 1) * r.fh}`}
                x1={0}
                x2={w}
                y1={(i + 1) * r.fh}
                y2={(i + 1) * r.fh}
                className="jc-joint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.01 }}
              />
            ))}
          </AnimatePresence>
        </svg>
        <figcaption className="jc-cap">
          <span>
            {m(w)} × {m(l)} m
          </span>
          <span>
            {formatLabel(f)} mm, {r.cols} × {r.rows}
          </span>
        </figcaption>
      </figure>
    </div>
  )
}
