import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { DemoNote } from '../components/Demo'
import { designById, labelOf, tileUrl } from '../data/range'
import { TLink } from '../motion/Transition'
import { loadImage, paintLay } from '../studio/paint'
import { composeFloor, greyOf, SAMPLE, U, V } from '../studio/photo'
import { useDealer } from '../studio/project'
import { layFor } from '../studio/state'
import { shopOf } from './state'

// The showroom visualizer, as a dealer meets it: their customer's own room,
// before and after, with the stone changed in a tap; then the three places it
// works (the customer's photo, the showroom screen, the customer's phone).
// The manufacturer gives it to its dealers; the dealers sell its tiles with it.

const PICKS = ['calacatta', 'nero', 'rovere', 'trav-bianco', 'portoro', 'tz-laguna']

export function ShowroomVisualizer() {
  const [dealer, setDealer] = useDealer()
  const shop = shopOf(dealer)
  const nav = useNavigate()
  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">Showroom visualizer.</h1>
        <p className="lead">Your customer picks a stone and sees it in their own room, on your screen or on their phone, and decides while they are in your shop.</p>
      </header>

      <RoomSwap />

      <section className="dl-ways" aria-label="Three ways to use it">
        <article>
          <h2 className="dl-h2">On their photo</h2>
          <p>A customer sends a photo of their room on WhatsApp. Mark the floor, lay any stone, and send the picture back before they have left the shop.</p>
          <TLink className="btn btn-ink btn-sm btn-arrow" to="/studio/photo" data-cursor="hover">
            Lay stone on a photo
          </TLink>
        </article>
        <article>
          <h2 className="dl-h2">On your showroom screen</h2>
          <p>
            Seven rooms on the big screen, with {shop.name}’s name on them, your prices and your stock. Left alone, it shows itself: rooms and hours in turn.
          </p>
          <button
            className="btn btn-ink btn-sm btn-arrow"
            onClick={() => {
              setDealer({ ...dealer, on: true, showroom: dealer.showroom || shop.name })
              nav('/studio')
            }}
            data-cursor="hover"
          >
            Open it in dealer mode
          </button>
        </article>
        <article>
          <h2 className="dl-h2">On their phone</h2>
          <p>The room they laid goes home with them: a code to scan, the same room on their phone, and the stone on their own floor through the camera.</p>
          <TLink className="btn btn-line btn-sm btn-arrow" to="/studio" data-cursor="hover">
            Try it in the Studio
          </TLink>
        </article>
      </section>
      <DemoNote topic="imagery" />
    </div>
  )
}

/** the sample room, before and after: a divider to drag, and the stone changed in a tap */
function RoomSwap() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [design, setDesign] = useState(PICKS[0])
  const [split, setSplit] = useState(0.5)
  const [ready, setReady] = useState(false)
  const after = useRef<HTMLCanvasElement>(null)
  const grey = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    loadImage(SAMPLE.src).then((i) => {
      grey.current = greyOf(i)
      setImg(i)
    })
  }, [])

  useEffect(() => {
    if (!img || !grey.current || !after.current) return
    let live = true
    const d = designById(design)!
    const lay = layFor(d, 'floor')
    paintLay(lay, [SAMPLE.size[0] * (U[1] - U[0]), SAMPLE.size[1] * (V[1] - V[0])], 300).then((tex) => {
      if (!live || !after.current) return
      composeFloor(after.current, { img, grey: grey.current!, tex, quad: SAMPLE.quad, mask: SAMPLE.mask, strokes: [], shade: 0.55 }, 0.75, 26)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [img, design])

  const d = designById(design)!
  return (
    <section className="dl-swap" aria-label="Before and after">
      <div className="dl-swap-frame" style={{ aspectRatio: '1672 / 941' }}>
        <img src={SAMPLE.src} alt="A customer's empty room, its cement floor as it is" />
        <canvas ref={after} style={{ clipPath: `inset(0 0 0 ${split * 100}%)`, opacity: ready ? 1 : 0 }} role="img" aria-label={`The same room with its floor in ${labelOf(d, d.colourways[0].slug)}`} />
        <span className="dl-swap-line" style={{ left: `${split * 100}%` }} aria-hidden />
        <span className="dl-swap-tag" style={{ left: 16 }}>
          Before
        </span>
        <span className="dl-swap-tag" style={{ right: 16 }}>
          {d.name}
        </span>
        <input
          type="range"
          min={0.02}
          max={0.98}
          step={0.005}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Before and after"
          className="dl-swap-range"
        />
      </div>
      <div className="dl-swap-picks" role="radiogroup" aria-label="Stone">
        {PICKS.map((id) => {
          const x = designById(id)!
          return (
            <button key={id} role="radio" aria-checked={id === design} onClick={() => setDesign(id)} data-cursor="hover">
              <img src={tileUrl(x.colourways[0].sm)} alt="" width={40} height={80} />
              <span>{x.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
