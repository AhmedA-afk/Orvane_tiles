import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { Close, RoomsSection } from '../components/Showcase'
import { designById } from '../data/range'
import { interiorsIn } from '../data/range/interiors'
import { gsap, MOTION, useGSAP } from '../motion/gsap'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import './showcase.css'

// Continuous vein. A Vena slab is printed in sequence from one master stone
// and numbered on its back, so the page is built from that number: four slabs
// come in out of order and fall into sequence until the vein runs across them;
// two slabs lie face to face and open like a book; then the visitor matches a
// wall of their own in any of the onyxes.

const STONES = ['azzurro', 'miele', 'pavone', 'tramonto', 'onice-rosso', 'calacatta'].map((id) => designById(id)!)
const FEATURE = STONES[0]
const BATCH = '0412'

/** the landscape master: the face turned a quarter, so four slabs cut it across */
const master = (id: string) => `/renders/show/vein-${id}.webp`
const face = (id: string) => `/tiles/${designById(id)!.colourways[0].file}`

type Layout = 'random' | 'sequence' | 'book' | 'four'
const LAYOUTS: { id: Layout; name: string; say: string }[] = [
  { id: 'random', name: 'Random', say: 'Four slabs as they come off an unsorted line: four different stones, the vein broken at every joint.' },
  { id: 'sequence', name: 'Sequence', say: 'Laid by number, the slabs cut one master stone, so the vein runs on across the joints.' },
  { id: 'book', name: 'Bookmatch', say: 'Every other slab turned over, so each joint is a mirror and the bands meet in chevrons.' },
  { id: 'four', name: 'Four-way', say: 'Four slabs mirrored across and down, so the stone opens out from the centre of the wall.' },
]

/** one slab of a wall: which part of which picture it shows, and which way round */
interface Piece {
  src: string
  size: string
  pos: string
  fx?: boolean
  fy?: boolean
}

function piecesFor(id: string, layout: Layout): Piece[] {
  const run = (i: number): Piece => ({ src: master(id), size: '400% 100%', pos: `${(i / 3) * 100}% 50%` })
  switch (layout) {
    case 'random':
      return [
        { ...run(2), fy: true },
        run(0),
        { ...run(3), fx: true, fy: true },
        { ...run(1), fx: true },
      ]
    case 'sequence':
      return [0, 1, 2, 3].map(run)
    case 'book':
      // consecutive slabs are all but identical, so turning every other one over mirrors each joint
      return [0, 1, 2, 3].map((i) => ({ src: face(id), size: 'cover', pos: '30% 50%', fx: i % 2 === 1 }))
    case 'four':
      return [0, 1, 2, 3].map((i) => ({ src: master(id), size: 'cover', pos: '40% 40%', fx: i % 2 === 1, fy: i > 1 }))
  }
}

function Slab({ p, className = '' }: { p: Piece; className?: string }) {
  return (
    <span className={`vn-slab ${className}`}>
      <span
        className="vn-face"
        style={{
          backgroundImage: `url(${p.src})`,
          backgroundSize: p.size,
          backgroundPosition: p.pos,
          transform: p.fx || p.fy ? `scale(${p.fx ? -1 : 1}, ${p.fy ? -1 : 1})` : undefined,
        }}
      />
    </span>
  )
}

export default function VeinPage() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      const q = gsap.utils.selector(root)
      gsap.from(q('.vn-hero .vn-slab'), { yPercent: 18, opacity: 0, duration: 1.6, stagger: 0.12, ease: 'expo.out', delay: 0.2 })
      gsap.from(q('.vn-hero .vn-stamp'), { opacity: 0, duration: 1, stagger: 0.12, delay: 0.6 })

      // out of order, then in sequence
      const order = q('.vn-order')[0] as HTMLElement
      order.classList.add('is-film')
      const slabs = q('.vn-order .vn-slab') as HTMLElement[]
      const was = [2, 0, 3, 1]
      const step = () => slabs[1].offsetLeft - slabs[0].offsetLeft
      const says = q('.vn-order .vn-say') as HTMLElement[]
      gsap.set(says[1], { autoAlpha: 0, y: 20 })
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: order, start: 'top top', end: '+=180%', pin: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true },
      })
      tl.fromTo(
        slabs,
        { x: (i: number) => (was[i] - i) * step(), y: (i: number) => [18, -26, 10, -14][i], rotation: (i: number) => (i % 2 ? 180 : 0) },
        { x: 0, y: 0, rotation: 0, duration: 0.6, stagger: 0.05 },
        0.15,
      )
      tl.to(says[0], { autoAlpha: 0, y: -20, duration: 0.1 }, 0.45)
      tl.to(says[1], { autoAlpha: 1, y: 0, duration: 0.12 }, 0.6)
      tl.to({}, { duration: 0.2 })

      // two slabs face to face, opened like a book
      const book = q('.vn-book')[0] as HTMLElement
      book.classList.add('is-film')
      const leaf = q('.vn-leaf')[0]
      const bookSays = q('.vn-book .vn-say') as HTMLElement[]
      gsap.set(bookSays[1], { autoAlpha: 0, y: 20 })
      const tb = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: book, start: 'top top', end: '+=180%', pin: true, scrub: 0.5, anticipatePin: 1 },
      })
      tb.fromTo(leaf, { rotateY: -180 }, { rotateY: 0, duration: 0.7 }, 0.15)
      tb.to(bookSays[0], { autoAlpha: 0, y: -20, duration: 0.1 }, 0.4)
      tb.to(bookSays[1], { autoAlpha: 1, y: 0, duration: 0.12 }, 0.6)
      tb.to({}, { duration: 0.15 })
      return () => {
        order.classList.remove('is-film')
        book.classList.remove('is-film')
      }
    })
  }, root)

  return (
    <div className="sh vn" ref={root}>
      {/* ---------------------------------------------------------------- hero */}
      <section className="vn-hero" aria-labelledby="vn-title">
        <div className="vn-hero-text">
          <h1 id="vn-title" className="vn-title">
            <span>One vein,</span> <span>four slabs.</span>
          </h1>
          <div className="vn-hero-say">
            <p className="lead">
              Vena slabs are printed in sequence from one master stone and numbered on the back, so the vein runs on
              across the joints and a wall reads as a single block.
            </p>
            <TLink className="btn btn-ink btn-arrow" to={`/collections/${FEATURE.id}`} data-cursor="hover">
              Configure {FEATURE.name}
            </TLink>
          </div>
        </div>
        <div className="vn-wall vn-hero-wall" role="img" aria-label={`Four slabs of ${FEATURE.name} in sequence, the vein running across all four`}>
          {piecesFor(FEATURE.id, 'sequence').map((p, i) => (
            <div key={i} className="vn-col">
              <span className="vn-stamp">
                {BATCH} / {i + 1}
              </span>
              <Slab p={p} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- in order */}
      <div className="vn-pin-wrap">
        <section className="vn-order" aria-labelledby="vn-order-title">
          <div className="vn-pin-text">
            <h2 id="vn-order-title" className="head">
              In sequence.
            </h2>
            <div className="vn-says">
              <p className="vn-say lead">Printed at random, four slabs are four different stones.</p>
              <p className="vn-say lead">Printed in order and laid by number, they are one.</p>
            </div>
          </div>
          <div className="vn-wall" aria-hidden>
            {piecesFor(FEATURE.id, 'sequence').map((p, i) => (
              <Slab key={i} p={p} />
            ))}
          </div>
        </section>
      </div>

      {/* ---------------------------------------------------------------- book */}
      <div className="vn-pin-wrap">
        <section className="vn-book" aria-labelledby="vn-book-title">
          <div className="vn-pin-text">
            <h2 id="vn-book-title" className="head">
              Open it like a book.
            </h2>
            <div className="vn-says">
              <p className="vn-say lead">Two slabs come off the line face to face, numbered as a pair.</p>
              <p className="vn-say lead">Opened at the joint, the second mirrors the first, and the bands meet in a chevron.</p>
            </div>
          </div>
          <div className="vn-spread" aria-hidden>
            <span className="vn-page">
              <span className="vn-face" style={{ backgroundImage: `url(${face(FEATURE.id)})` }} />
            </span>
            <span className="vn-leaf">
              {/* the mirror is flipped inside an unflipped side, so the side still faces front */}
              <span className="vn-front">
                <span className="vn-face vn-mirror" style={{ backgroundImage: `url(${face(FEATURE.id)})` }} />
              </span>
              <span className="vn-back">
                <b>
                  {BATCH} / 2
                </b>
                <span>{FEATURE.name}</span>
                <span>Bookmatch, B of A–B</span>
              </span>
            </span>
          </div>
        </section>
      </div>

      {/* ---------------------------------------------------------------- your wall */}
      <MatchWall />

      <RoomsSection id="vn-rooms" title="In the houses." shots={interiorsIn('gemelli')} />

      <Close
        id="vn-close"
        title="Order the set, not the slab."
        say="Every Gemelli design, and every Maestà marble, comes as a numbered set of two or four, cut in sequence from one print."
        fact="Sets of 2 or 4, numbered on the back"
        image={
          <div className="vn-close-wall">
            {piecesFor(FEATURE.id, 'four').map((p, i) => (
              <Slab key={i} p={p} />
            ))}
          </div>
        }
        actions={[
          { to: '/lines/gemelli', label: 'See Gemelli' },
          { to: '/quote', label: 'Order a sample set' },
        ]}
      />
    </div>
  )
}

function MatchWall() {
  const [stone, setStone] = useState(FEATURE.id)
  const [layout, setLayout] = useState<Layout>('book')
  const d = designById(stone)!
  const L = LAYOUTS.find((x) => x.id === layout)!
  return (
    <section className="sh-sec vn-match" aria-labelledby="vn-match-title">
      <header className="sh-head">
        <h2 id="vn-match-title" className="head" data-rv>
          Match a wall.
        </h2>
        <p className="lead" data-rv>
          Choose a stone and lay four slabs of it. The same four slabs make every one of these walls.
        </p>
      </header>
      <div className="vn-match-grid">
        <div className="vn-controls" data-rv>
          <div className="vn-stones" role="radiogroup" aria-label="Stone">
            {STONES.map((s) => (
              <button key={s.id} role="radio" aria-checked={s.id === stone} onClick={() => setStone(s.id)} data-cursor="hover">
                <img src={`/tiles/${s.colourways[0].sm}`} alt="" width={60} height={120} loading="lazy" />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <div className="seg vn-seg" role="radiogroup" aria-label="How the slabs are laid">
            {LAYOUTS.map((x) => (
              <button key={x.id} role="radio" aria-checked={x.id === layout} onClick={() => setLayout(x.id)} data-cursor="hover">
                {x.id === layout && <motion.span className="seg-thumb" layoutId="vn-seg" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <span>{x.name}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={layout} className="vn-match-say" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {L.say}
            </motion.p>
          </AnimatePresence>
          <TLink className="btn btn-line btn-arrow" to={`/collections/${d.id}`} data-cursor="hover">
            Configure {d.name}
          </TLink>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stone + layout}
            className={`vn-wall vn-wall-${layout}`}
            role="img"
            aria-label={`Four slabs of ${d.name}, ${L.name.toLowerCase()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {piecesFor(stone, layout).map((p, i) => (
              <Slab key={i} p={p} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <DemoNote topic="technology" />
    </section>
  )
}
