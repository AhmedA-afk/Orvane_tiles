import { motion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { productById, sizeById } from '../data/catalog'
import { DESIGNS, tileSrc } from '../textures/designs'
import './Visualizer.css'

const OPTIONS = ['statuario-8016', 'calacatta-6012', 'nero-6012', 'armani-8016', 'travertino-6012', 'rovere-2012', 'terrazzo-6060', 'cemento-6060']
type Layout = 'straight' | 'brick'

// The room is built as a CSS 3D box on a fixed 1200×760 stage, then scaled to
// cover its frame. 0.3 px per mm: a 5 m wide, 4.5 m deep, 2.8 m high room.
const PX = 0.3
const FW = 5000 * PX
const FD = 4500 * PX
const STAGE_W = 1200
const STAGE_H = 760

export function Visualizer() {
  const [productId, setProductId] = useState(OPTIONS[0])
  const [layout, setLayout] = useState<Layout>('straight')
  const p = productById(productId)!
  const size = sizeById(p.size)

  return (
    <section className="viz" id="visualizer" aria-label="Room visualizer">
      <div className="wrap">

        <div className="viz-frame">
          <Room design={p.design} sizeW={size.w} sizeH={size.h} layout={layout} glossy={p.finish === 'Glossy'} />

          <div className="viz-panel">
            <div className="viz-current">
              <p className="viz-name">{p.name}</p>
              <p className="viz-spec">
                {size.label} mm, {p.finish.toLowerCase()}
              </p>
            </div>
            <fieldset className="viz-swatches">
              <legend className="visually-hidden">Design</legend>
              {OPTIONS.map((id) => {
                const o = productById(id)!
                return (
                  <button
                    key={id}
                    className="viz-swatch"
                    aria-pressed={id === productId}
                    onClick={() => setProductId(id)}
                    title={o.name}
                  >
                    <SwatchImg design={o.design} />
                    <span className="visually-hidden">{o.name}</span>
                  </button>
                )
              })}
            </fieldset>
            <div className="segmented viz-layout" role="radiogroup" aria-label="Laying pattern">
              {(['straight', 'brick'] as Layout[]).map((l) => (
                <button key={l} role="radio" aria-checked={l === layout} onClick={() => setLayout(l)}>
                  {l === layout && (
                    <motion.span
                      className="segmented-thumb"
                      layoutId="layout-thumb"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="segmented-label">{l === 'straight' ? 'Straight lay' : 'Half offset'}</span>
                </button>
              ))}
            </div>
            <div className="viz-more">
              <p>
                The full visualizer works on photos of real rooms, so a dealer can show a customer their own kitchen in
                Calacatta before anything ships.
              </p>
              <a className="btn btn-line" href="#quote">
                Book a dealer demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SwatchImg({ design }: { design: string }) {
  return (
    <span
      className="viz-swatch-img"
      style={{ backgroundColor: DESIGNS[design].base, backgroundImage: `url(${tileSrc(design, 'sm')})` }}
    />
  )
}

function Room({
  design,
  sizeW,
  sizeH,
  layout,
  glossy,
}: {
  design: string
  sizeW: number
  sizeH: number
  layout: Layout
  glossy: boolean
}) {
  const stage = useRef<HTMLDivElement>(null)
  const scale = useCoverScale(stage)

  // long side runs into the room, as most large formats are laid
  const tw = sizeW * PX
  const td = sizeH * PX
  const cols = Math.ceil(FW / tw) + 1
  const rows = Math.ceil(FD / td)

  // each tile shows a different crop of the texture, like random faces in a box
  const tiles = useMemo(() => {
    const r = rng(design.length * 31 + sizeW)
    const out: { key: string; style: CSSProperties }[] = []
    for (let row = 0; row < rows; row++) {
      const shift = layout === 'brick' && row % 2 ? -tw / 2 : 0
      for (let c = 0; c < cols; c++) {
        out.push({
          key: `${row}-${c}`,
          style: {
            left: c * tw + shift,
            bottom: row * td,
            width: tw,
            height: td,
            backgroundPosition: `${Math.round(r() * 100)}% ${Math.round(r() * 100)}%`,
            backgroundSize: `${Math.round(140 + r() * 80)}% auto`,
            // nearest rows land first
            animationDelay: `${row * 70 + c * 8}ms`,
          },
        })
      }
    }
    return out
  }, [design, sizeW, rows, cols, tw, td, layout])

  return (
    <div className="room" ref={stage} role="img" aria-label={`Room laid with ${DESIGNS[design].name}`}>
      <div className="room-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="room-scene">
          <div className="room-ceiling" />
          <div className="room-back" />
          <div className="room-left">
            <div className="room-window">
              <span />
              <span />
            </div>
          </div>
          <div className="room-right" />
          <div
            className="room-floor"
            style={{ '--tex': `url(${tileSrc(design)})`, '--base': DESIGNS[design].base } as CSSProperties}
          >
            <div className="room-tiles" key={design + layout}>
              {tiles.map((t) => (
                <i key={t.key} style={t.style} />
              ))}
            </div>
            <div className="room-reflection" data-on={glossy ? '' : undefined} />
            <div className="room-sun" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Small seeded generator, so each design's faces stay put between renders. */
function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Scale the fixed-size stage so it covers its container. */
function useCoverScale(ref: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setScale(Math.max(width / STAGE_W, height / STAGE_H))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return scale
}
