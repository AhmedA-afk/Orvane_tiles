import { useEffect, useRef, useState } from 'react'
import { designsIn, type RangeDesign } from '../data/range'

// One stone, every surface: a bathroom built in CSS 3D at true scale (a pixel
// is 4 mm), its walls in 1200 × 2400 mm panels, its floor in 600 × 1200 mm
// tiles and its vanity top cut from the same stone. Choose a stone and every
// surface changes together. The room is drawn, not rendered, so it loads
// instantly and works without WebGL.

const MM = 4
const px = (mm: number) => mm / MM
const ROOM = { w: 3200, h: 2600, d: 2800 }
const STAGE = { w: 960, h: 600 }

/** grout lines every w × h millimetres, as a repeating picture over the stone */
const grout = (w: number, h: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${px(w)}' height='${px(h)}'%3E%3Cpath d='M0 0.5H${px(w)}M0.5 0V${px(h)}' stroke='rgba(240,238,232,.7)' stroke-width='1.5'/%3E%3C/svg%3E")`

function surface(d: RangeDesign, joint: [number, number]) {
  return {
    backgroundImage: `${grout(...joint)}, url(/tiles/${d.colourways[0].file})`,
    backgroundSize: `${px(joint[0])}px ${px(joint[1])}px, ${px(1600)}px ${px(3200)}px`,
  }
}

export function RoomBox({ line = 'terme' as const }: { line?: 'terme' }) {
  const stones = designsIn(line)
  const [id, setId] = useState(stones[2]?.id ?? stones[0].id)
  const d = stones.find((s) => s.id === id)!
  const box = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(0.6)

  // the stage is drawn at a fixed size and scaled to its column
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / STAGE.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const wall = surface(d, [1200, 2400])
  const floor = surface(d, [600, 1200])
  const plain = { backgroundImage: `url(/tiles/${d.colourways[0].file})`, backgroundSize: `${px(1600)}px ${px(3200)}px` }
  const W = px(ROOM.w)
  const H = px(ROOM.h)
  const D = px(ROOM.d)

  return (
    <div className="rb">
      <div className="rb-view" ref={box} style={{ height: STAGE.h * k }}>
        <div className="rb-stage" style={{ width: STAGE.w, height: STAGE.h, transform: `scale(${k})` }} role="img" aria-label={`A bathroom in ${d.name}: walls, floor and vanity top in the same stone`}>
          <div className="rb-room" style={{ width: W, height: H }}>
            <div className="rb-face rb-back" style={{ width: W, height: H, transform: `translateZ(${-D / 2}px)`, ...wall }} />
            <div className="rb-face rb-left" style={{ width: D, height: H, transform: `translateX(${-D / 2}px) rotateY(90deg)`, left: 0, ...wall }} />
            <div className="rb-face rb-right" style={{ width: D, height: H, transform: `translateX(${W - D / 2}px) rotateY(-90deg)`, left: 0, ...wall }} />
            <div className="rb-face rb-floor" style={{ width: W, height: D, transform: `translateY(${H - D / 2}px) rotateX(90deg)`, top: 0, ...floor }} />
            <div className="rb-face rb-ceil" style={{ width: W, height: D, transform: `translateY(${-D / 2}px) rotateX(-90deg)`, top: 0 }} />
            {/* the mirror and the shower rose on the back wall */}
            <div className="rb-face rb-mirror" style={{ width: px(1100), height: px(800), left: px(260), top: H - px(2000), transform: `translateZ(${-D / 2 + 2}px)` }} />
            <div className="rb-face rb-rose" style={{ left: W - px(700), top: H - px(2150), transform: `translateZ(${-D / 2 + 4}px)` }} />
            {/* the vanity: a 12 mm top with a mitred 100 mm apron, floating at 850 mm */}
            <div className="rb-face rb-vtop" style={{ width: px(1600), height: px(550), left: px(10), top: H - px(850) - px(550) / 2, transform: `translateZ(${-D / 2 + px(275)}px) rotateX(90deg)`, ...plain }}>
              <span className="rb-basin" />
            </div>
            <div className="rb-face rb-cab" style={{ width: px(1560), height: px(420), left: px(30), top: H - px(750), transform: `translateZ(${-D / 2 + px(520)}px)` }} />
            <div className="rb-face rb-vfront" style={{ width: px(1600), height: px(100), left: px(10), top: H - px(850), transform: `translateZ(${-D / 2 + px(550)}px)`, ...plain }} />
            {/* the glass screen of the walk-in shower */}
            <div className="rb-face rb-glass" style={{ width: px(1300), height: px(2000), left: W - px(1100) - px(1300) / 2, top: H - px(2000), transform: `translateZ(${-D / 2 + px(650)}px) rotateY(90deg)` }} />
          </div>
        </div>
      </div>
      <div className="rb-pick" role="radiogroup" aria-label="Stone">
        {stones.map((s) => (
          <button key={s.id} role="radio" aria-checked={s.id === id} onClick={() => setId(s.id)} data-cursor="hover">
            <img src={`/tiles/${s.colourways[0].sm}`} alt="" width={60} height={120} loading="lazy" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
      <dl className="rb-spec">
        <div>
          <dt>Walls</dt>
          <dd>1200 × 2400 mm panels, 6 mm, satin</dd>
        </div>
        <div>
          <dt>Floor</dt>
          <dd>600 × 1200 mm, 9 mm, Presa, R11</dd>
        </div>
        <div>
          <dt>Vanity</dt>
          <dd>Cut from a slab, mitred to a 100 mm apron</dd>
        </div>
      </dl>
    </div>
  )
}
