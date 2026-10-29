import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { InteriorImage } from '../components/Interior'
import { LiquidGlass } from '../components/LiquidGlass'
import { FINISHES, type Finish } from '../data/catalog'
import { COUNTS, designById, designsIn, formatById, formatLabel, LINES } from '../data/range'
import { FINISH_NOTE } from '../data/notes'
import { roomsOf, SPACES } from '../data/spaces'
import { setPageReady, useRevealed } from '../lib/ready'
import { gsap, SplitText, whenGsap } from '../motion/gsap'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import room from '../home/room.json'
import { D, follow, pointer, ROOM_STONE, ROOM_TILE, setLook, snap, type Pose } from '../home/store'
import './home.css'

const Stage = lazy(() => import('../home/Stage'))

// The home page is a short film about one slab, cut to the scroll. It opens in
// a room whose wall is laid in Calacatta; the scroll takes one tile off the
// wall and towards you, and the room falls away. The tile turns edge-on to
// show how thin it is, fills a black screen where the light runs across it
// and a glass lens shows the veins, changes stone beside the index of the
// eight lines, and becomes the floor of a room.
// Every scene is a tween on one paused timeline measured in screens of
// scroll, so it plays the same forwards and back. Without motion, every
// chapter is simply laid out and readable.

/** where the room's tile is on screen: the photograph covers its frame */
function tileRect(pic: HTMLElement) {
  const r = pic.getBoundingClientRect()
  const k = Math.max(r.width / room.w, r.height / room.h)
  const t = room.tile
  return {
    x: r.left + (r.width - room.w * k) / 2 + t.x * k,
    y: r.top + (r.height - room.h * k) / 2 + t.y * k,
    w: t.w * k,
    h: t.h * k,
  }
}

/** the slab in the wall, exactly over the tile, on a stage `vw` × `vh` */
const HERO = (t: ReturnType<typeof tileRect>, vw: number, vh: number): Pose => ({
  sx: ((t.x + t.w / 2) / vw) * 2 - 1,
  sy: 1 - ((t.y + t.h / 2) / vh) * 2,
  h: t.h / vh,
  rx: 0,
  ry: 0,
  rz: 0,
  float: 0,
  shadow: 0,
  vis: 0,
  key: -0.35,
  // the room's light: lower and warmer than the studio's, so the slab sits in the photograph
  dark: 0.45,
  warm: 0.6,
  lens: 0,
  fan: 0,
  lift: 0,
  lay: 0,
})

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [stage, setStage] = useState(false)
  // if WebGL never comes up, the page still makes its entrance
  const [late, setLate] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setLate(true), 5000)
    return () => clearTimeout(id)
  }, [])
  const [finish, setFinish] = useState<Finish>('Glossy')
  const [stone, setStone] = useState(0)
  const revealed = useRevealed()
  const live = useRef({ finish, stone })
  live.current = { finish, stone }

  useReveal(root)

  // the preloader waits for the stage
  useEffect(() => {
    if (reduce) return
    setPageReady(false)
    const fallback = setTimeout(() => setPageReady(true), 5000)
    return () => {
      clearTimeout(fallback)
      setPageReady(true)
    }
  }, [reduce])

  // the pointer, for the slab's lean and the lens
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointer.active = true
    }
    const leave = () => (pointer.active = false)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      pointer.active = false
    }
  }, [])

  useFilm(root, !reduce, live)
  useIntro(root, revealed && (stage || reduce || late), reduce)

  return (
    <div className="h" ref={root} data-reduce={reduce ? '' : undefined}>
      <div className="h-backdrop" aria-hidden />
      {!reduce && (
        <Suspense fallback={null}>
          <Stage
            onReady={() => {
              setStage(true)
              setPageReady(true)
            }}
          />
        </Suspense>
      )}

      <Hero reduce={reduce} />
      <Thin />
      <Surface finish={finish} onFinish={setFinish} />
      <Stones active={stone} onActive={setStone} reduce={reduce} />
      <RoomReveal />
      <SpacesChapter />
      <Morbi />
      <Samples reduce={reduce} />
      <ChapterMark />
    </div>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero({ reduce }: { reduce: boolean }) {
  return (
    <section className="ch hero" aria-labelledby="hero-title" data-chapter="Orvane">
      {/* the room holds still while its tile comes away; the stage draws the slab between it and the tile's stand-in */}
      <div className="hero-room" aria-hidden>
        <div className="hero-pic">
          <div className="hero-imgs">
            {!reduce && <img src="/renders/home/room.jpg" alt="" width={room.w} height={room.h} />}
            {!reduce && <img className="hero-blur" src="/renders/home/room-blur.jpg" alt="" width={room.w} height={room.h} />}
            <img className="hero-full" src="/renders/home/room-full.jpg" alt="" width={room.w} height={room.h} fetchPriority="high" />
          </div>
        </div>
        <span className="hero-cast" />
      </div>
      {!reduce && <img className="hero-piece" src="/renders/home/piece.jpg" alt="" aria-hidden />}
      <span className="hero-focus" aria-hidden />
      <p className="hero-tag" aria-hidden>
        <b>Calacatta Oro</b>
        <span>Maestà, polished</span>
      </p>
      <div className="hero-foot">
        <div className="hero-say">
          <h1 id="hero-title" className="hero-title">
            <span className="visually-hidden">Orvane Ceramica. </span>
            <span className="hero-line">
              <span>Porcelain that</span>
            </span>{' '}
            <span className="hero-line">
              <span>reads as stone.</span>
            </span>
          </h1>
          <p className="hero-sub">Slabs and tiles, pressed, fired and polished in Morbi.</p>
          <div className="hero-ctas">
            <TLink className="btn btn-light btn-arrow" to="/collections" data-cursor="hover">
              Explore the collection
            </TLink>
            <TLink className="btn btn-line" to="/quote" data-cursor="hover">
              Order samples
            </TLink>
          </div>
        </div>
        <div className="hero-side">
          <dl className="hero-meta mono">
            <div>
              <dt>Collection</dt>
              <dd>2026</dd>
            </div>
            <div>
              <dt>Designs</dt>
              <dd>{COUNTS.designs}</dd>
            </div>
            <div>
              <dt>Morbi</dt>
              <dd>22.82° N 70.84° E</dd>
            </div>
          </dl>
          <DemoNote topic="imagery" className="hero-note" />
        </div>
      </div>
      <p className="hero-scroll mono" aria-hidden>
        <span>Scroll</span>
        <i />
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ thin */

function Thin() {
  return (
    <section className="ch thin" aria-labelledby="thin-title" data-chapter="Thin">
      <div className="pin">
        <p className="thin-nine" aria-hidden>
          <span className="thin-digit">9</span>
          <span className="thin-unit mono">millimetres</span>
        </p>
        <div className="thin-copy thin-a">
          <h2 id="thin-title" className="title">
            Nine millimetres.
          </h2>
          <p>
            A slab you can lift with two people and fix to a wall, with a breaking strength of 35 N/mm² and up. Seen
            edge-on, it nearly disappears.
          </p>
        </div>
        <div className="thin-dims" aria-hidden>
          <span className="dim dim-v">
            <i />
            <b className="mono">1600</b>
          </span>
          <span className="dim dim-h">
            <i />
            <b className="mono">800</b>
          </span>
        </div>
        <div className="thin-copy thin-b">
          <h3 className="title">800 × 1600 mm.</h3>
          <p>Large formats lay with fewer joints, so a floor reads as one continuous stone.</p>
          <TLink className="u thin-link" to="/technology/scale" data-cursor="hover">
            See our largest, 1800 × 3600 mm →
          </TLink>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ surface */

function Surface({ finish, onFinish }: { finish: Finish; onFinish: (f: Finish) => void }) {
  return (
    <section className="ch surface tone-dark" aria-labelledby="surface-title" data-chapter="Surface">
      <div className="pin">
        <div className="surface-a">
          <h2 id="surface-title" className="head">
            Light tells the truth.
          </h2>
          <p className="lead">
            Every design is printed from a scan of real stone, in up to eight faces so no two slabs in a crate repeat,
            then fired at 1,210 °C and polished until a reflection runs clean across it.
          </p>
        </div>
        <LiquidGlass className="surface-b" radius={30} strength={30} style={{ ['--lg-tint' as string]: 'rgb(10 10 12 / 0.62)', ['--lg-edge' as string]: 'rgb(255 255 255 / 0.35)', ['--lg-ink' as string]: '#f1f1ee', ['--lg-blur' as string]: '22px' }}>
          <h3 className="title">Look closer.</h3>
          <p className="mono surface-hint">Move the loupe across the stone</p>
          <div className="finish">
            <div role="radiogroup" aria-label="Finish" className="finish-row">
              {FINISHES.map((f) => (
                <button key={f} role="radio" aria-checked={f === finish} onClick={() => onFinish(f)} data-cursor="hover">
                  {f === finish && (
                    <motion.span
                      className="finish-thumb"
                      layoutId="finish-thumb"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span>{f}</span>
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={finish}
              className="surface-note"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {FINISH_NOTE[finish]}
            </motion.p>
          </AnimatePresence>
          <TLink className="u surface-link" to="/technology/surface-lab" data-cursor="hover">
            Into the surface lab →
          </TLink>
        </LiquidGlass>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ stones */

function Stones({ active, onActive, reduce }: { active: number; onActive: (i: number) => void; reduce: boolean }) {
  const list = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const items = list.current?.querySelectorAll('li')
    if (!items) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onActive(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    items.forEach((li) => io.observe(li))
    return () => io.disconnect()
  }, [onActive])
  const l = LINES[active]
  const feat = designById(l.feature)!
  const big = l.formats.map((f) => formatById(f)!).reduce((a, f) => (f.w * f.h > a.w * a.h ? f : a))
  return (
    <section className="ch stones" aria-labelledby="stones-title" data-chapter="Lines">
      <header className="stones-head">
        <h2 id="stones-title" className="title" data-rv>
          Eight lines.
        </h2>
        <p className="mono muted" data-rv>
          Collection 2026 · {COUNTS.designs} designs · {COUNTS.colourways} colourways
        </p>
      </header>
      <ol className="stones-list" ref={list}>
        {LINES.map((x, i) => (
          <li key={x.id} data-i={i} data-on={i === active ? '' : undefined}>
            <TLink to={`/lines/${x.id}`} data-cursor="View">
              {x.name}
            </TLink>
          </li>
        ))}
      </ol>
      <aside className="stones-card" aria-live="polite">
        {reduce && <img src={`/renders/range/${feat.id}--${feat.colourways[0].slug}.jpg`} alt="" className="stones-poster" />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="stones-name">{l.kind}</p>
            <p className="stones-note">{l.tagline}</p>
            <p className="mono muted">
              {designsIn(l.id).length} designs · up to {formatLabel(big)} mm · {feat.name}
            </p>
          </motion.div>
        </AnimatePresence>
      </aside>
    </section>
  )
}

/* ------------------------------------------------------------------ room */

const SPOTS = [
  { x: 27, y: 83, label: 'Floor', name: 'Nero Marquina', note: '600 × 1200 mm, polished, laid straight with a dark joint' },
  { x: 55, y: 67, label: 'Table', name: 'Travertino Classico', note: 'A low block cut from the same stone' },
  { x: 74, y: 30, label: 'Wall', name: 'Try Statuario Bianco', note: 'Floor to ceiling, in the Studio' },
]

function RoomReveal() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="ch room" aria-labelledby="room-title" data-chapter="Room">
      <div className="pin">
        <h2 id="room-title" className="display room-say">
          <span>Then,</span> <span>a room.</span>
        </h2>
        <div className="room-frame">
          <img src="/renders/room-day.jpg" alt="A living room floored in polished Nero Marquina, with a travertine table, a low sofa and a garden window" />
          {SPOTS.map((s, i) => (
            <button
              key={s.label}
              className="spot"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              onPointerEnter={() => setOpen(i)}
              onPointerLeave={() => setOpen(null)}
              data-cursor="hover"
            >
              <span className="visually-hidden">{s.label}</span>
              <AnimatePresence>
                {open === i && (
                  <motion.span
                    className="spot-card"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mono">{s.label}</span>
                    <b>{s.name}</b>
                    <span>{s.note}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
          <LiquidGlass className="room-card" radius={28} strength={26}>
            <div className="room-card-in">
              <p>Lay any design in this room, at its true size, before it ships.</p>
              <TLink className="btn btn-ink btn-sm btn-arrow" to="/studio" data-cursor="hover">
                Open the Studio
              </TLink>
            </div>
          </LiquidGlass>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ spaces */

// After the one room, every room: the five spaces pass sideways as the page
// scrolls down, each its own photograph, each opening its page.
function SpacesChapter() {
  return (
    <section className="ch spaces" aria-labelledby="spaces-title" data-chapter="Spaces">
      <div className="pin spaces-pin">
        <header className="spaces-head">
          <h2 id="spaces-title" className="head">
            Every room, in stone.
          </h2>
          <p className="lead">Kitchens, baths, rooms to live in, hotels and the outdoors.</p>
        </header>
        <ol className="spaces-track">
          {SPACES.map((sp) => {
            const rooms = roomsOf(sp)
            return (
              <li key={sp.id}>
                <TLink to={`/spaces/${sp.id}`} className="spaces-card" data-cursor="Open">
                  <span className="spaces-pic">
                    <InteriorImage shot={rooms[0]} sizes="(min-width: 900px) 56vw, 84vw" />
                  </span>
                  <span className="spaces-name">{sp.name}</span>
                  <span className="spaces-say">{rooms.length} rooms</span>
                </TLink>
              </li>
            )
          })}
          <li className="spaces-all">
            <TLink to="/spaces" className="btn btn-ink btn-arrow" data-cursor="hover">
              All spaces
            </TLink>
          </li>
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ morbi */

function Odometer({ value, on }: { value: string; on: boolean }) {
  let d = 0
  return (
    <span className="odo" aria-label={value}>
      {value.split('').map((ch, i) => {
        if (!/\d/.test(ch))
          return (
            <span key={i} className="odo-sep" aria-hidden>
              {ch}
            </span>
          )
        const n = Number(ch)
        const delay = d++ * 0.07
        return (
          <span key={i} className="odo-col" aria-hidden>
            <span
              className="odo-strip"
              style={{ transform: `translateY(${on ? -n * 10 : 0}%)`, transitionDelay: `${delay}s` }}
            >
              {'0123456789'.split('').map((k) => (
                <span key={k}>{k}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

function Morbi() {
  const ref = useRef<HTMLDListElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { rootMargin: '0px 0px -20% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section className="ch morbi tone-dark" aria-labelledby="morbi-title" data-chapter="Morbi">
      <div className="morbi-grid">
        <div className="morbi-copy">
          <h2 id="morbi-title" className="display" data-rv>
            Made in Morbi.
          </h2>
          <p className="lead" data-rv>
            Morbi, in Gujarat, makes most of India’s ceramic tiles. Our line presses, prints, fires and polishes every
            slab under one roof, and sorts each one by shade and caliber before it is crated for Mundra.
          </p>
          <TLink className="btn btn-light btn-arrow" to="/factory" data-rv data-cursor="hover">
            Inside the factory
          </TLink>
        </div>
        <figure className="morbi-fig" data-rv>
          <img src="/renders/kiln.jpg" alt="Slabs riding a roller line into the glowing mouth of a kiln" loading="lazy" />
          <figcaption className="mono">Roller kiln · 1,210 °C</figcaption>
        </figure>
      </div>
      <dl className="morbi-nums" ref={ref}>
        <div>
          <dt>in the kiln</dt>
          <dd>
            <Odometer value="1,210" on={on} />
            <small>°C</small>
          </dd>
        </div>
        <div>
          <dt>pressed every day</dt>
          <dd>
            <Odometer value="32,000" on={on} />
            <small>m²</small>
          </dd>
        </div>
        <div>
          <dt>stones in six formats</dt>
          <dd>
            <Odometer value="15" on={on} />
          </dd>
        </div>
        <div>
          <dt>countries a year</dt>
          <dd>
            <Odometer value="48" on={on} />
          </dd>
        </div>
      </dl>
      <p className="mono morbi-sample">Sample figures for a demo company</p>
    </section>
  )
}

/* ------------------------------------------------------------------ samples */

function Samples({ reduce }: { reduce: boolean }) {
  return (
    <section className="ch samples" aria-labelledby="samples-title" data-chapter="Samples">
      <div className="samples-copy">
        <h2 id="samples-title" className="display o-lines" data-rv>
          <span>
            <span>Hold it</span>
          </span>
          <span>
            <span>in your hand.</span>
          </span>
        </h2>
        <p className="lead" data-rv>
          Choose up to six designs. The box leaves Morbi within five days, by courier, anywhere.
        </p>
        <div className="hero-ctas" data-rv>
          <TLink className="btn btn-ink btn-arrow" to="/quote" data-cursor="hover">
            Fill your sample box
          </TLink>
          <TLink className="btn btn-line" to="/studio" data-cursor="hover">
            Try them in a room
          </TLink>
        </div>
      </div>
      {reduce && (
        <div className="samples-poster" aria-hidden>
          {['calacatta', 'nero', 'onice', 'travertino'].map((d) => (
            <img key={d} src={`/renders/card-${d}.jpg`} alt="" />
          ))}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ chapter mark */

function ChapterMark() {
  const [name, setName] = useState('Orvane')
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('.ch[data-chapter]')]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setName((e.target as HTMLElement).dataset.chapter!)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])
  const order = ['Orvane', 'Thin', 'Surface', 'Lines', 'Room', 'Spaces', 'Morbi', 'Samples']
  const i = order.indexOf(name)
  return (
    <p className="chapter-mark mono" aria-hidden>
      <span>{String(i + 1).padStart(2, '0')}</span>
      <i style={{ transform: `scaleX(${(i + 1) / order.length})` }} />
      <AnimatePresence mode="wait">
        <motion.span key={name} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.4 }}>
          {name}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}

/* ------------------------------------------------------------------ the film */

function useFilm(
  root: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  live: React.RefObject<{ finish: Finish; stone: number }>,
) {
  useEffect(() => {
    if (!enabled) return
    let tl: ReturnType<typeof gsap.timeline> | null = null
    let S = { edge: 0, surface: 0, stones: 0, stonesEnd: 0, room: 0 }
    let unit = window.innerHeight
    let gone = false
    let splits: InstanceType<typeof SplitText>[] = []
    let tick: (() => void) | null = null

    const build = () => {
      const el = root.current
      if (!el || gone) return
      tl?.kill()
      splits.forEach((s) => s.revert())
      splits = []
      const q = (s: string) => el.querySelector(s) as HTMLElement
      unit = q('.hero').offsetHeight || window.innerHeight
      const top = (n: HTMLElement) => (n.getBoundingClientRect().top + window.scrollY) / unit
      const len = (n: HTMLElement) => n.offsetHeight / unit
      const wide = window.innerWidth / window.innerHeight > 1.05
      const thin = top(q('.thin'))
      const thinLen = len(q('.thin'))
      const surface = top(q('.surface'))
      const surfaceLen = len(q('.surface'))
      const stones = top(q('.stones'))
      const stonesLen = len(q('.stones'))
      const room = top(q('.room'))
      const roomLen = len(q('.room'))
      const spaces = top(q('.spaces'))
      const spacesLen = len(q('.spaces'))
      const morbi = top(q('.morbi'))
      const samples = top(q('.samples'))
      const samplesLen = len(q('.samples'))
      S = { edge: thin + (thinLen - 1) * 0.32, surface, stones, stonesEnd: stones + stonesLen, room }

      // the tile in the wall, and the slab put exactly over it
      const hold = q('.hero-room')
      el.classList.add('is-film')
      gsap.set(hold, { clearProps: 'transform' })
      const tile = tileRect(q('.hero-pic'))
      for (const [k, v] of Object.entries({ tx: tile.x, ty: tile.y, tw: tile.w, th: tile.h })) el.style.setProperty(`--${k}`, `${v}px`)
      const hero = HERO(tile, hold.clientWidth, hold.clientHeight)
      Object.assign(D, hero)
      if (window.scrollY < 2) snap.now = true
      const piece = q('.hero-piece')
      follow.el = piece
      const bg = q('.h-backdrop')
      gsap.set(bg, { backgroundColor: '#f1f1ee' })
      const tone = { k: 0 }

      tl = gsap.timeline({ paused: true, defaults: { ease: 'none', duration: 1 } })
      const io = 'power2.inOut'
      const out = 'power3.out'

      // the room: the tile comes off the wall and towards you, tipping as it
      // leaves, and the room falls away behind it; then it squares up and
      // starts to turn. At first the flat tile in the page covers the slab
      // (it has the photograph's light), then fades to hand over.
      tl.to(D, { vis: 1, duration: 0.005 }, 0)
      tl.to(q('.hero-full'), { autoAlpha: 0, duration: 0.005 }, 0)
      tl.fromTo(piece, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.005 }, 0)
      tl.to(piece, { autoAlpha: 0, duration: 0.12 }, 0.06)
      tl.to([q('.hero-focus'), q('.hero-tag')], { autoAlpha: 0, duration: 0.08 }, 0)
      tl.to([q('.hero-foot'), q('.hero-scroll')], { autoAlpha: 0, y: -40, ease: 'power1.in', duration: 0.3 }, 0)
      // it slides down out of its place as it comes, so the gap it leaves shows
      tl.to(D, { sy: wide ? 0.02 : 0.08, ease: 'power1.inOut', duration: 0.44 }, 0)
      tl.to(D, { h: hero.h * 2.1, ease: 'power2.in', duration: 0.44 }, 0)
      tl.to(D, { rx: 0.14, ease: 'sine.inOut', duration: 0.24 }, 0.16)
      // its shadow on the wall, thrown right by the low sun, spreading as it leaves
      const cast = q('.hero-cast')
      tl.fromTo(cast, { opacity: 0, x: 0, y: 0 }, { opacity: 0.55, x: 12, y: 6, ease: 'power1.out', duration: 0.14 }, 0.02)
      tl.to(cast, { opacity: 0, x: 44, y: 20, scale: 1.18, ease: 'power1.in', duration: 0.26 }, 0.16)
      // the eye goes to the tile: the room softens, steps back and falls away
      tl.fromTo(q('.hero-blur'), { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.34 }, 0.08)
      tl.to(hold, { scale: 0.95, ease: 'power1.inOut', duration: 0.6 }, 0.1)
      tl.to(hold, { autoAlpha: 0, ease: 'power1.in', duration: 0.38 }, 0.36)
      tl.to(
        D,
        { ry: -1.2, rx: 0, rz: 0, sx: 0, sy: 0, h: wide ? 0.78 : 0.62, float: 0.25, shadow: 1, key: -0.7, dark: 0, warm: 0, ease: io, duration: 0.58 },
        0.42,
      )

      // thin: edge-on, then face-on with its dimensions
      const pinT = thinLen - 1
      tl.to(D, { ry: -Math.PI / 2, float: 0, key: -1, ease: io, duration: pinT * 0.22 }, thin)
      const digit = q('.thin-digit')
      tl.fromTo(digit, { yPercent: 105, fontWeight: 800 }, { yPercent: 0, fontWeight: 800, ease: out, duration: pinT * 0.14 }, thin + pinT * 0.06)
      tl.to(digit, { fontWeight: 100, ease: io, duration: pinT * 0.18 }, thin + pinT * 0.18)
      tl.fromTo(q('.thin-unit'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, ease: out, duration: pinT * 0.1 }, thin + pinT * 0.24)
      const a = new SplitText(q('.thin-a h2'), { type: 'lines,words', mask: 'lines' })
      splits.push(a)
      tl.from(a.words, { yPercent: 110, stagger: 0.02, ease: out, duration: pinT * 0.12 }, thin + pinT * 0.14)
      tl.fromTo(q('.thin-a p'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: out, duration: pinT * 0.12 }, thin + pinT * 0.2)
      // out with the first beat, in with the face and its measures
      tl.to([q('.thin-nine'), q('.thin-a')], { opacity: 0, y: -40, ease: 'power2.in', duration: pinT * 0.08 }, thin + pinT * 0.44)
      tl.to(D, { ry: 0, h: wide ? 0.72 : 0.56, ease: io, duration: pinT * 0.18 }, thin + pinT * 0.46)
      tl.fromTo(q('.thin-dims'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: pinT * 0.06 }, thin + pinT * 0.6)
      tl.fromTo(q('.dim-v i'), { scaleY: 0 }, { scaleY: 1, ease: io, duration: pinT * 0.1 }, thin + pinT * 0.6)
      tl.fromTo(q('.dim-h i'), { scaleX: 0 }, { scaleX: 1, ease: io, duration: pinT * 0.1 }, thin + pinT * 0.63)
      const b = new SplitText(q('.thin-b h3'), { type: 'lines,words', mask: 'lines' })
      splits.push(b)
      tl.from(b.words, { yPercent: 110, stagger: 0.03, ease: out, duration: pinT * 0.1 }, thin + pinT * 0.6)
      tl.fromTo(el.querySelectorAll('.thin-b p, .thin-b .thin-link'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: pinT * 0.02, ease: out, duration: pinT * 0.1 }, thin + pinT * 0.64)

      // into the dark: the measures clear, the slab turns to landscape, the room goes black
      const toDark = thin + thinLen - 1
      tl.to([q('.thin-dims'), q('.thin-b')], { opacity: 0, ease: 'power1.in', duration: 0.18 }, toDark - 0.22)
      tl.to(D, { rz: Math.PI / 2, h: wide ? 0.7 : 0.4, sy: wide ? -0.05 : 0.04, shadow: 0, key: -0.95, ease: io, duration: 1 }, toDark)
      tl.to(D, { dark: 1, ease: io, duration: 0.6 }, toDark + 0.25)
      tl.to(bg, { backgroundColor: '#050506', ease: io, duration: 0.6 }, toDark + 0.25)
      tl.to(tone, { k: 1, ease: 'none', duration: 0.6 }, toDark + 0.25)

      // surface: the light runs across, then the slab fills the screen under the lens
      const sp = surfaceLen - 1
      const sa = new SplitText(q('.surface-a h2'), { type: 'lines,words', mask: 'lines' })
      splits.push(sa)
      tl.from(sa.words, { yPercent: 110, stagger: 0.03, ease: out, duration: sp * 0.14 }, surface - 0.15)
      tl.fromTo(q('.surface-a p'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: out, duration: sp * 0.14 }, surface)
      tl.to(D, { key: 0.95, ry: 0.14, ease: 'sine.inOut', duration: sp * 0.42 }, surface)
      tl.to(q('.surface-a'), { opacity: 0, y: -40, ease: 'power2.in', duration: sp * 0.1 }, surface + sp * 0.42)
      tl.to(D, { h: wide ? 2.3 : 2.2, sy: 0, ry: 0, key: 0.55, ease: io, duration: sp * 0.22 }, surface + sp * 0.45)
      tl.to(D, { lens: 1, ease: out, duration: sp * 0.12 }, surface + sp * 0.62)
      tl.fromTo(q('.surface-b'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: out, duration: sp * 0.12 }, surface + sp * 0.62)
      tl.to(D, { key: 0.4, ease: 'sine.inOut', duration: sp * 0.26 }, surface + sp * 0.74)

      // out of the dark and into the index: the slab steps aside, upright
      const toStones = surface + sp
      tl.to(D, { lens: 0, ease: 'power2.in', duration: 0.2 }, toStones)
      tl.to(q('.surface-b'), { opacity: 0, y: -30, ease: 'power2.in', duration: 0.25 }, toStones)
      tl.to(
        D,
        // on a phone the slab keeps to the top right corner, clear of the names
        { h: wide ? 0.6 : 0.3, rz: 0, ry: -0.42, rx: 0.04, sx: wide ? 0.44 : 0.56, sy: wide ? 0 : 0.5, key: -0.3, shadow: 1, float: 1, ease: io, duration: 1 },
        toStones + 0.1,
      )
      tl.to(D, { dark: 0, ease: io, duration: 0.6 }, toStones + 0.3)
      tl.to(bg, { backgroundColor: '#f1f1ee', ease: io, duration: 0.6 }, toStones + 0.3)
      tl.to(tone, { k: 0, ease: 'none', duration: 0.6 }, toStones + 0.3)

      // the index holds; then the slab lies down to become a floor
      const lay = stones + stonesLen - 1
      // (below the words that announce it, which sit at the top)
      tl.to(D, { sx: 0, sy: wide ? -0.24 : -0.3, rx: -1.05, ry: 0, rz: 0.0, h: wide ? 1.15 : 0.9, float: 0, shadow: 0, ease: io, duration: 1.1 }, lay)

      // the room opens in a circle; the slab is under it
      const rp = roomLen - 1
      const say = q('.room-say')
      // (once the chapter has nearly reached the top, so the words arrive above the floor, not on it)
      tl.fromTo(say.children, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.08, ease: out, duration: 0.35 }, room - 0.15)
      tl.fromTo(
        q('.room-frame'),
        { clipPath: 'circle(0% at 50% 64%)' },
        { clipPath: 'circle(80% at 50% 64%)', ease: 'power2.in', duration: rp * 0.55 },
        room,
      )
      tl.fromTo(q('.room-frame img'), { scale: 1.25 }, { scale: 1, ease: 'power2.out', duration: rp * 0.7 }, room)
      tl.to(D, { vis: 0, ease: 'none', duration: 0.05 }, room + rp * 0.55)
      tl.fromTo(q('.room-frame').querySelectorAll('.spot'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.06, ease: 'back.out(2)', duration: rp * 0.12 }, room + rp * 0.6)
      tl.fromTo(q('.room-card'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: out, duration: rp * 0.15 }, room + rp * 0.66)

      // the spaces pass sideways while the chapter holds
      const track = q('.spaces-track')
      const travel = Math.max(0, track.scrollWidth - window.innerWidth)
      tl.fromTo(q('.spaces-head'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: out, duration: 0.4 }, spaces - 0.5)
      tl.fromTo(track, { x: 0 }, { x: -travel, ease: 'none', duration: Math.max(0.5, spacesLen - 1.2) }, spaces + 0.1)

      // the dark of the kiln, then back to the light for the samples
      tl.to(bg, { backgroundColor: '#050506', ease: io, duration: 0.5 }, morbi - 0.6)
      tl.to(tone, { k: 1, ease: 'none', duration: 0.5 }, morbi - 0.6)
      tl.to(bg, { backgroundColor: '#f1f1ee', ease: io, duration: 0.5 }, samples - 0.6)
      tl.to(tone, { k: 0, ease: 'none', duration: 0.5 }, samples - 0.6)
      // on a phone the samples rise under the words once those have settled at the top
      tl.to(D, { fan: 1, ease: 'power3.out', duration: 0.9 }, samples - (wide ? 0.3 : 0))
      // and leave with the chapter, a screen's height for a screen of scroll, before the footer
      const leave = Math.max(samples + 1, samples + samplesLen - 1)
      tl.to(D, { lift: 1, ease: 'none', duration: 1 }, leave)

      const html = document.documentElement
      let lastTone = ''
      tick = () => {
        if (!tl) return
        const t = window.scrollY / unit
        tl.time(Math.max(0, Math.min(tl.duration(), t)))
        root.current?.classList.toggle('is-scrolled', t > 0.6)
        // while the loupe is up, it is the cursor
        html.classList.toggle('loupe-on', D.lens > 0.5)
        const next = tone.k > 0.5 ? 'dark' : 'light'
        if (next !== lastTone) {
          html.dataset.tone = next
          lastTone = next
        }
        // which stone, which finish, for this part of the film
        const L = live.current!
        // the tile from the room until it is edge-on, then the same stone as a slab
        if (t < S.edge) setLook({ design: ROOM_TILE, finish: 'Glossy' })
        else if (t < S.surface - 0.5) setLook({ design: ROOM_STONE, finish: 'Glossy' })
        else if (t < S.stones - 0.4) setLook({ design: 'nero', finish: L.finish })
        else if (t < S.stonesEnd - 1) {
          setLook({ design: LINES[L.stone].feature, finish: 'Glossy' })
        } else setLook({ design: 'nero', finish: 'Glossy' })
      }
      tick()
    }

    let resize = 0
    const onResize = () => {
      clearTimeout(resize)
      resize = window.setTimeout(build, 200)
    }

    whenGsap().then(() => {
      if (gone) return
      // wait a frame so the fonts have set the headings' lines
      document.fonts?.ready.then(() => {
        if (gone) return
        build()
        gsap.ticker.add(tick!)
        window.addEventListener('resize', onResize)
      })
    })
    return () => {
      gone = true
      clearTimeout(resize)
      window.removeEventListener('resize', onResize)
      if (tick) gsap?.ticker.remove(tick)
      tl?.kill()
      splits.forEach((s) => s.revert())
      follow.el = null
      root.current?.classList.remove('is-film')
      delete document.documentElement.dataset.tone
      document.documentElement.classList.remove('loupe-on')
    }
  }, [root, enabled, live])
}

/* ------------------------------------------------------------------ the entrance */

function useIntro(root: React.RefObject<HTMLDivElement | null>, go: boolean, reduce: boolean) {
  const played = useRef(false)
  useEffect(() => {
    if (!go || played.current) return
    played.current = true
    if (reduce) {
      root.current?.classList.add('is-in')
      return
    }
    whenGsap().then(() => {
      const el = root.current
      if (!el) return
      const q = gsap.utils.selector(el)
      // the room opens out of a smaller frame, then the words rise in their masks
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .add(() => el.classList.add('is-in'))
        .from(q('.hero-pic'), { clipPath: 'inset(7% 9% 7% 9% round 40px)', duration: 2 }, 0)
        .from(q('.hero-imgs'), { scale: 1.14, duration: 2.6 }, 0)
        .from(q('.hero-line > span'), { yPercent: 110, duration: 1.3, stagger: 0.08 }, 0.4)
        .from(q('.hero-sub, .hero-ctas > *'), { y: 20, opacity: 0, duration: 1, stagger: 0.07 }, 0.6)
        .from(q('.hero-meta > div, .hero-scroll'), { y: 14, opacity: 0, duration: 1, stagger: 0.06 }, 0.8)
        .from(q('.hero-focus, .hero-tag'), { opacity: 0, scale: 1.06, duration: 1.2, stagger: 0.1 }, 1.3)
        .from('.nav > *', { y: -16, opacity: 0, duration: 1, stagger: 0.08 }, 0.5)
    })
  }, [go, reduce, root])
}

