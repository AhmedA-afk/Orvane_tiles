import { useRef } from 'react'
import { DemoNote } from '../components/Demo'
import { JointCounter } from '../components/JointCounter'
import { Close, PhotoFigure, RoomsSection, shot } from '../components/Showcase'
import { designById, formatById, formatLabel, lineById, specFor, thicknessByMm } from '../data/range'
import { interiorsIn } from '../data/range/interiors'
import { DESKTOP, gsap, MOTION, useGSAP } from '../motion/gsap'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import { useTone } from '../motion/useTone'
import './showcase.css'

// The largest slab, shown bigger than seems reasonable. The page opens on the
// slab itself standing between the two halves of its size; then it grows
// beside a person and a door through the formats to 1800 × 3600 mm; then the
// visitor counts the joints it saves in a room of their own; then a wall of
// it, its three thicknesses, the rooms, and the slab once more.

const STONE = designById('portoro')!
const MAX = formatById('1800x3600')!
const LINE = lineById('maesta')

const STEPS = [
  { f: '600x600', say: 'A tile. Most of the world’s floors are laid in it.' },
  { f: '1200x2400', say: 'A slab, already taller than the two people who carry it.' },
  { f: '1600x3200', say: 'Taller than a door by more than a metre.' },
  { f: '1800x3600', say: 'Maestà. Higher than most rooms, so a wall goes up in one piece.' },
].map((s) => ({ ...s, format: formatById(s.f)! }))

// the drawing, in millimetres: a 1.75 m figure, a door, and the slab
const SW = 5200
const SH = 3900
const DOOR = { x: 1250, w: 900, h: 2100 }
const SLAB_X = 2750

const kg = (mm: number) => Math.round(specFor(STONE, MAX.id, mm, 'glossy').kgPerPiece)

export default function ScalePage() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  useTone(root)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    // on a wide screen the two halves of the size part as the slab rises past them
    mm.add(`${MOTION} and ${DESKTOP}`, () => {
      const q = gsap.utils.selector(root)
      const hero = q('.sc-hero')[0]
      const by = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to(q('.sc-tower'), { yPercent: -10, ease: 'none', scrollTrigger: by })
      gsap.to(q('.sc-size-a'), { xPercent: -14, ease: 'none', scrollTrigger: { ...by } })
      gsap.to(q('.sc-size-b'), { xPercent: 14, ease: 'none', scrollTrigger: { ...by } })
    })
    mm.add(MOTION, () => {
      const q = gsap.utils.selector(root)
      // the slab rises into place and the size parts around it
      gsap.from(q('.sc-tower'), { y: 140, opacity: 0, duration: 1.8, ease: 'expo.out', delay: 0.15 })
      gsap.from(q('.sc-size-a, .sc-size-b'), { y: 90, opacity: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out', delay: 0.25 })

      // the slab grows through the formats beside the figure and the door
      const grow = q('.sc-grow')[0] as HTMLElement
      grow.classList.add('is-film')
      const slab = q('.sc-slab')[0]
      const steps = q('.sc-step') as HTMLElement[]
      gsap.set(slab, { '--w': STEPS[0].format.w, '--h': STEPS[0].format.h })
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 24 })
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: grow, start: 'top top', end: '+=260%', pin: true, scrub: 0.5, anticipatePin: 1 },
      })
      tl.to({}, { duration: 0.12 })
      STEPS.slice(1).forEach((s, i) => {
        const at = 0.12 + i * 0.28
        tl.to(slab, { '--w': s.format.w, '--h': s.format.h, duration: 0.2 }, at)
        tl.to(steps[i], { autoAlpha: 0, y: -24, duration: 0.08, ease: 'power2.in' }, at + 0.04)
        tl.to(steps[i + 1], { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power3.out' }, at + 0.12)
      })
      tl.to({}, { duration: 0.1 })
      return () => grow.classList.remove('is-film')
    })
  }, root)

  return (
    <div className="sh sc" ref={root}>
      {/* ---------------------------------------------------------------- hero */}
      <section className="sc-hero" aria-labelledby="sc-title">
        <h1 id="sc-title" className="sc-size">
          <span className="sc-size-a">1800</span>
          <span className="visually-hidden"> × </span>
          <span className="sc-size-b">3600</span>
          <span className="visually-hidden"> mm: Maestà, the largest slab we press</span>
        </h1>
        <img
          className="sc-tower"
          src="/renders/show/tower-portoro.jpg"
          alt="A slab of polished Portoro, 1800 by 3600 millimetres, standing on its edge"
          width={1400}
          height={2100}
          fetchPriority="high"
        />
        <div className="sc-hero-say">
          <p>
            <b>Maestà</b> is the largest slab we press: a wall in one piece of stone, and a floor with almost no joints.
          </p>
          <TLink className="btn btn-ink btn-arrow" to={`/collections/${STONE.id}?format=${MAX.id}`} data-cursor="hover">
            See it at full size
          </TLink>
        </div>
        <div className="sc-hero-facts">
          <p>
            <b>{formatLabel(MAX)} mm</b>
          </p>
          <p>6, 12 and 20 mm thick</p>
          <p>6.48 m² of stone in one piece</p>
          <DemoNote topic="sizes" />
        </div>
      </section>

      {/* ---------------------------------------------------------------- grow */}
      <div className="sc-grow-wrap">
        <section className="sc-grow" aria-labelledby="sc-grow-title">
          <div className="sc-grow-text">
            <h2 id="sc-grow-title" className="head">
              Next to you.
            </h2>
            <ol className="sc-steps">
              {STEPS.map((s) => (
                <li key={s.f} className="sc-step">
                  <b className="num">{formatLabel(s.format)}</b>
                  <span>{s.say}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure className="sc-scene" aria-label="The formats to scale beside a 1.75 m figure and a 2.1 m door">
            <svg viewBox={`0 0 ${SW} ${SH}`} className="sc-scene-svg" aria-hidden>
              {/* the formats it grows through, as outlines */}
              {STEPS.slice(0, -1).map((s) => (
                <rect key={s.f} x={SLAB_X} y={SH - s.format.h} width={s.format.w} height={s.format.h} className="sc-was" />
              ))}
              <g transform={`translate(${320} ${SH - 1750})`} className="sc-person">
                <ellipse cx="300" cy="112" rx="86" ry="110" />
                <path d="M270 232C200 245 120 255 100 300C85 330 82 380 80 440L72 960C70 995 118 1000 122 965L145 470L160 900L182 1700L140 1750L288 1750L292 1040Q300 1015 308 1040L312 1750L460 1750L418 1700L440 900L455 470L478 965C482 1000 530 995 528 960L520 440C518 380 515 330 500 300C480 255 400 245 330 232Z" />
              </g>
              <g className="sc-door">
                <rect x={DOOR.x} y={SH - DOOR.h} width={DOOR.w} height={DOOR.h} />
                <rect x={DOOR.x + 90} y={SH - DOOR.h + 90} width={DOOR.w - 180} height={DOOR.h - 90} className="sc-door-in" />
                <circle cx={DOOR.x + DOOR.w - 150} cy={SH - 1050} r="28" />
              </g>
              <rect x="0" y={SH - 6} width={SW} height="6" className="sc-floor" />
            </svg>
            <div className="sc-slab" style={{ ['--w' as string]: MAX.w, ['--h' as string]: MAX.h, backgroundImage: `url(/tiles/${STONE.colourways[0].file})` }} />
            <figcaption className="sc-scene-cap">
              <span style={{ left: `${(620 / SW) * 100}%` }}>1.75 m</span>
              <span style={{ left: `${((DOOR.x + DOOR.w / 2) / SW) * 100}%` }}>2.1 m door</span>
            </figcaption>
          </figure>
        </section>
      </div>

      {/* ---------------------------------------------------------------- joints */}
      <section className="sh-sec sc-joints" aria-labelledby="sc-joints-title">
        <header className="sh-head">
          <h2 id="sc-joints-title" className="head" data-rv>
            Count the joints.
          </h2>
          <p className="lead" data-rv>
            Lay one room two ways. Every joint is a line of grout to clean, and a place where the stone stops.
          </p>
        </header>
        <div data-rv>
          <JointCounter stone={`/tiles/${STONE.colourways[0].file}`} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- wall */}
      <PhotoFigure
        id="sc-wall-title"
        room={shot('maesta-portoro-dining')}
        heading="Floor to ceiling."
        figure="3.6"
        unit="m"
        say="One slab stands taller than the room it is in, so a wall of Portoro goes up with no joint across it."
        more={[
          ['6.48 m²', 'of stone in each piece'],
          ['3 slabs', 'for a wall 5.4 metres long'],
        ]}
        demo="sizes"
      />

      {/* ---------------------------------------------------------------- thickness */}
      <section className="sh-sec sc-thick" aria-labelledby="sc-thick-title">
        <header className="sh-head">
          <h2 id="sc-thick-title" className="head" data-rv>
            Thin, for its size.
          </h2>
          <p className="lead" data-rv>
            Three thicknesses of one surface. The colour runs through the body, so a cut or mitred edge shows stone.
          </p>
        </header>
        <ul className="sc-mm">
          {LINE.thicknesses.map((mm) => {
            const s = specFor(STONE, MAX.id, mm, 'glossy')
            return (
              <li key={mm} data-rv>
                <b className="sc-mm-n num">
                  {mm}
                  <small>mm</small>
                </b>
                <span className="sc-mm-edge" style={{ ['--t' as string]: mm, backgroundImage: `url(/tiles/${STONE.colourways[0].file})` }} aria-hidden />
                <span className="sc-mm-facts">
                  <span>
                    <b className="num">{kg(mm)} kg</b> a slab, {s.packing.pieces} to a crate
                  </span>
                  <span className="muted">{thicknessByMm(mm)?.uses.join(', ')}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <DemoNote topic="figures" />
      </section>

      <RoomsSection id="sc-rooms" title="In the houses." shots={interiorsIn('maesta')} />

      <Close
        id="sc-close"
        title="Start with one slab."
        say="Choose a stone and see it at 1800 × 3600 mm, then order a sample cut from the same batch."
        fact={`From 6 mm and ${kg(6)} kg a slab`}
        image={<img src="/renders/show/turn-portoro.jpg" alt="" width={1400} height={2100} loading="lazy" />}
        actions={[
          { to: `/collections/${STONE.id}?format=${MAX.id}`, label: 'Configure Maestà' },
          { to: '/lines/maesta', label: 'All Maestà designs' },
        ]}
      />
    </div>
  )
}
