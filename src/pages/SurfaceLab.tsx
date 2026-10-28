import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { Close, PhotoFigure, shot } from '../components/Showcase'
import { FINISHES, finishById, type FinishId } from '../data/range'
import { gsap, MOTION, useGSAP } from '../motion/gsap'
import { useReveal } from '../motion/useReveal'
import { useTone } from '../motion/useTone'
import './showcase.css'

// The surface lab: the benches a buyer's own lab would set up, run here on
// our samples. The DIN ramp tilts until a boot slips; a stain is spilt, left
// a day and wiped; a pan comes off the flame; a hardness scale sets porcelain
// against a knife; and a gloss meter reads all eight finishes in one frame.
// Every result is a sample figure for a demo company.

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function SurfaceLab() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  useTone(root)

  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      const q = gsap.utils.selector(root)
      gsap.from(q('.lab-hero-text > *'), { y: 40, opacity: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out', delay: 0.15 })
      gsap.from(q('.lab-ramp'), { y: 60, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.3 })

      // the pan comes down, the plate heats, the pan lifts away, nothing is left
      const heat = q('.lab-heat')[0]
      const temp = q('.lab-heat-t b')[0]
      const t = { c: 20 }
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: heat, start: 'top 75%', end: 'bottom 35%', scrub: 0.6 },
      })
      tl.fromTo(q('.lab-pan'), { y: -150 }, { y: 0, duration: 0.3 }, 0)
      tl.fromTo(q('.lab-glow'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.25)
      tl.fromTo(t, { c: 20 }, { c: 280, duration: 0.35, ease: 'none', onUpdate: () => (temp.textContent = String(Math.round(t.c))) }, 0.15)
      tl.to(q('.lab-pan'), { y: -150, duration: 0.3 }, 0.62)
      tl.to(q('.lab-glow'), { opacity: 0, duration: 0.25 }, 0.7)
      tl.fromTo(q('.lab-heat-after'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.12 }, 0.85)

      // the hardness bars grow from zero
      gsap.from(q('.lab-mohs i'), {
        scaleX: 0,
        duration: 1.2,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.lab-mohs')[0], start: 'top 75%' },
      })
    })
  }, root)

  return (
    <div className="sh lab" ref={root}>
      <section className="lab-hero" aria-labelledby="lab-title">
        <div className="lab-hero-text">
          <h1 id="lab-title" className="lab-title">
            Surface lab.
          </h1>
          <p className="lead">
            The tests a buyer runs on a sample, run here on ours. Tilt it, stain it, heat it, scratch it, and hold it
            to the light.
          </p>
          <DemoNote topic="tests" />
        </div>
        <Ramp />
      </section>

      <Stain />
      <Heat />
      <Hardness />
      <Gloss />

      <PhotoFigure
        id="lab-water-title"
        room={shot('terme-bianco-shower')}
        heading="Water stays out."
        figure="0.1"
        unit="%"
        say="Less than a tenth of a percent of its weight in water: frost cannot split it and nothing soaks in."
        more={[
          ['100 cycles', 'of freezing and thawing, unmarked'],
          ['99%', 'fewer bacteria on Puro glaze after a day'],
        ]}
        demo="tests"
      />

      <Close
        id="lab-close"
        title="Test it yourself."
        say="Order a sample box and run every one of these on the real surface: spill on it, scratch it, stand on it wet."
        fact="Up to six finishes, from Morbi in five days"
        image={
          <div className="lab-close-fan">
            {['terme--presa', 'aperto--grip', 'tattile--carving'].map((x) => (
              <img key={x} src={`/renders/show/sample-${x}.jpg`} alt="" width={900} height={900} loading="lazy" />
            ))}
          </div>
        }
        actions={[
          { to: '/quote', label: 'Fill your sample box' },
          { to: '/technology', label: 'All technologies' },
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ the ramp */

// DIN 51130: a tester in oiled boots walks the sample as it tilts; the angle
// at which they slip sets the rating. These angles are sample results.
const RAMP: { id: FinishId; at: number }[] = [
  { id: 'specchio', at: 8 },
  { id: 'satin', at: 14 },
  { id: 'carving', at: 22 },
  { id: 'presa', at: 24 },
  { id: 'grip', at: 31 },
]
const BANDS = [
  { r: 'R9', a: 6, b: 10 },
  { r: 'R10', a: 10, b: 19 },
  { r: 'R11', a: 19, b: 27 },
  { r: 'R12', a: 27, b: 35 },
]
const HX = 70
const HY = 400
const LEN = 620
const rad = (d: number) => (d * Math.PI) / 180
const at = (r: number, d: number) => `${HX + r * Math.cos(rad(d))} ${HY - r * Math.sin(rad(d))}`

function Ramp() {
  const [fi, setFi] = useState(3)
  const [angle, setAngle] = useState(12)
  const [running, setRunning] = useState(false)
  const raf = useRef(0)
  const f = finishById(RAMP[fi].id)
  const slipAt = RAMP[fi].at
  const slipped = angle >= slipAt
  const band = BANDS.find((b) => b.r === f.slip)!

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const run = () => {
    cancelAnimationFrame(raf.current)
    const end = slipAt + 3
    if (reduce()) return setAngle(end)
    setRunning(true)
    const t0 = performance.now()
    const tick = (now: number) => {
      const a = Math.min(end, ((now - t0) / 1000) * 9)
      setAngle(Math.round(a * 10) / 10)
      if (a < end) raf.current = requestAnimationFrame(tick)
      else setRunning(false)
    }
    setAngle(0)
    raf.current = requestAnimationFrame(tick)
  }

  return (
    <div className="lab-ramp">
      <h2 className="title">The ramp.</h2>
      <svg className="lab-ramp-svg" viewBox="0 0 760 450" role="img" aria-label={`A ramp tilted to ${Math.round(angle)} degrees under a ${f.name} sample: ${slipped ? `the boot slipped at ${slipAt} degrees` : 'the boot holds'}`}>
        {BANDS.map((b) => (
          <g key={b.r} className={b.r === f.slip ? 'lab-band is-on' : 'lab-band'}>
            <path d={`M${HX} ${HY} L${at(640, b.a)} A640 640 0 0 0 ${at(640, b.b)} Z`} />
            <text x={HX + 668 * Math.cos(rad((b.a + b.b) / 2))} y={HY - 668 * Math.sin(rad((b.a + b.b) / 2))} dominantBaseline="middle">
              {b.r}
            </text>
          </g>
        ))}
        <rect x="20" y={HY} width="720" height="5" className="lab-ink" />
        <path d={`M${HX - 16} ${HY + 2} L${HX} ${HY - 14} L${HX + 16} ${HY + 2} Z`} className="lab-ink" />
        {/* the jack that lifts the far end */}
        <line x1={HX + LEN * Math.cos(rad(angle))} y1={HY - LEN * Math.sin(rad(angle))} x2={HX + LEN * Math.cos(rad(angle))} y2={HY} className="lab-jack" />
        <path d={`M${HX + 150} ${HY} A150 150 0 0 0 ${at(150, angle)}`} className="lab-arc" />
        <g transform={`rotate(${-angle} ${HX} ${HY})`}>
          <rect x={HX} y={HY - 18} width={LEN} height="18" rx="2" className="lab-ink" />
          <rect x={HX + 40} y={HY - 30} width={LEN - 80} height="12" className="lab-sample" />
          <g className="lab-boot" style={{ transform: `translateX(${slipped ? 40 : 330}px)` }}>
            <path d="M0 0H130V-16Q128-34 104-40L76-48 72-118H20L16-44Q2-40 0-22Z" transform={`translate(${HX} ${HY - 30})`} />
          </g>
        </g>
      </svg>
      <div className="lab-ramp-read" aria-live="polite">
        <b className="num">{Math.round(angle)}°</b>
        <span>
          {slipped ? (
            <>
              <strong>Slipped at {slipAt}°.</strong> {f.name} is rated {f.slip}: {band.a}–{band.b}° on the ramp.
            </>
          ) : (
            <>
              <strong>Holding.</strong> {f.name}, rated {f.slip}, grips to {slipAt}°.
            </>
          )}
        </span>
      </div>
      <div className="lab-ramp-controls">
        <div className="chips" role="radiogroup" aria-label="Finish under test">
          {RAMP.map((r, i) => (
            <button
              key={r.id}
              role="radio"
              aria-checked={i === fi}
              onClick={() => {
                cancelAnimationFrame(raf.current)
                setRunning(false)
                setFi(i)
                setAngle(0)
              }}
              data-cursor="hover"
            >
              {finishById(r.id).name} · {finishById(r.id).slip}
            </button>
          ))}
        </div>
        <label className="lab-tilt">
          <span>Tilt</span>
          <input
            type="range"
            min={0}
            max={36}
            step={0.5}
            value={angle}
            onChange={(e) => {
              cancelAnimationFrame(raf.current)
              setRunning(false)
              setAngle(+e.target.value)
            }}
          />
        </label>
        <button className="btn btn-ink btn-sm" onClick={run} disabled={running} data-cursor="hover">
          {running ? 'Tilting…' : 'Run the test'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ stains */

const STAINS = [
  { id: 'wine', name: 'Red wine', c: '#5a0f22' },
  { id: 'coffee', name: 'Coffee', c: '#3a2214' },
  { id: 'turmeric', name: 'Turmeric', c: '#d49a12' },
  { id: 'oil', name: 'Olive oil', c: '#7d7322' },
]
const STEPS = ['clean', 'spilt', 'day', 'wiped'] as const
const NEXT: Record<(typeof STEPS)[number], string> = {
  clean: 'Spill it',
  spilt: 'Leave it a day',
  day: 'Wipe with water',
  wiped: 'Start again',
}
const BLOB = 'M60 22C88 6 132 10 150 34C172 62 160 92 136 104C112 116 98 140 70 132C40 124 14 108 16 78C18 50 36 36 60 22Z'

function Stain() {
  const [si, setSi] = useState(0)
  const [step, setStep] = useState(0)
  const s = STAINS[si]
  const now = STEPS[step]
  const marks = (porcelain: boolean) => {
    const on = now !== 'clean'
    const gone = porcelain && now === 'wiped'
    const ring = !porcelain && (now === 'day' || now === 'wiped')
    return (
      <svg viewBox="0 0 180 150" className="lab-stain-svg" aria-hidden>
        <defs>
          <filter id={`spill-${porcelain ? 'p' : 'm'}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={porcelain ? 3 : 7} />
            <feDisplacementMap in="SourceGraphic" scale={porcelain ? 14 : 22} />
            <feGaussianBlur stdDeviation={porcelain ? 0.6 : 1.4} />
          </filter>
        </defs>
        <motion.path
          d={BLOB}
          filter={`url(#spill-${porcelain ? 'p' : 'm'})`}
          fill={s.c}
          initial={false}
          animate={{
            opacity: !on || gone ? 0 : now === 'wiped' ? 0.32 : porcelain ? 0.78 : 0.86,
            scale: on ? (ring && !porcelain ? 1.12 : 1) : 0.3,
          }}
          style={{ transformOrigin: '50% 50%', mixBlendMode: 'multiply' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d={BLOB}
          filter={`url(#spill-${porcelain ? 'p' : 'm'})`}
          fill="none"
          stroke={s.c}
          strokeWidth="3"
          initial={false}
          animate={{ opacity: ring ? 0.7 : 0, scale: 1.12 }}
          style={{ transformOrigin: '50% 50%', mixBlendMode: 'multiply' }}
          transition={{ duration: 0.8 }}
        />
      </svg>
    )
  }
  return (
    <section className="sh-sec lab-stain" aria-labelledby="lab-stain-title">
      <header className="sh-head">
        <h2 id="lab-stain-title" className="head" data-rv>
          Spill, wait, wipe.
        </h2>
        <p className="lead" data-rv>
          The same stain on our porcelain and on unsealed marble, left for a day, then wiped with warm water.
        </p>
      </header>
      <div className="lab-stain-grid">
        <div className="lab-stain-controls" data-rv>
          <div className="chips" role="radiogroup" aria-label="Stain">
            {STAINS.map((x, i) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={i === si}
                onClick={() => {
                  setSi(i)
                  setStep(0)
                }}
                data-cursor="hover"
              >
                {x.name}
              </button>
            ))}
          </div>
          <button className="btn btn-ink btn-arrow" onClick={() => setStep((step + 1) % STEPS.length)} data-cursor="hover">
            {NEXT[now]}
          </button>
          <ol className="lab-stain-steps" aria-label="Steps">
            {['Spilt', 'A day later', 'Wiped'].map((t, i) => (
              <li key={t} data-on={step > i ? '' : undefined}>
                {t}
              </li>
            ))}
          </ol>
        </div>
        {[true, false].map((porcelain) => (
          <figure key={String(porcelain)} className="lab-sample-sq" data-rv>
            <div className="lab-sample-face" style={{ backgroundImage: 'url(/tiles/statuario.webp)' }}>
              {marks(porcelain)}
            </div>
            <figcaption>
              <b>{porcelain ? 'Orvane porcelain' : 'Natural marble, unsealed'}</b>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={now + porcelain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {now === 'wiped'
                    ? porcelain
                      ? 'Clean. Class 5 under ISO 10545-14: off with warm water.'
                      : 'A ring that needs a poultice, and a dull etch where it sat.'
                    : now === 'day'
                      ? porcelain
                        ? 'Sitting on the surface.'
                        : 'Soaking into the stone.'
                      : now === 'spilt'
                        ? `${s.name}, just spilt.`
                        : 'Clean.'}
                </motion.span>
              </AnimatePresence>
            </figcaption>
          </figure>
        ))}
      </div>
      <DemoNote topic="tests" />
    </section>
  )
}

/* ------------------------------------------------------------------ heat */

function Heat() {
  return (
    <section className="sh-sec lab-heat" aria-labelledby="lab-heat-title">
      <div className="lab-heat-grid">
        <div className="lab-heat-text">
          <h2 id="lab-heat-title" className="head" data-rv>
            A pan off the flame.
          </h2>
          <p className="lead" data-rv>
            Set straight down at 280 °C. The slab was fired at 1,210 °C, so a pan is nothing it has not seen.
          </p>
          <p className="lab-heat-t num" aria-hidden>
            <b>280</b>
            <small>°C</small>
          </p>
          <p className="lab-heat-after" data-rv>
            <strong>No mark, no crack.</strong> Thermal shock, ISO 10545-9: passed.
          </p>
        </div>
        <svg className="lab-heat-svg" viewBox="0 0 700 420" role="img" aria-label="A hot pan set down on a 12 mm porcelain counter and lifted away, leaving no mark">
          <defs>
            <filter id="lab-blur" x="-50%" y="-200%" width="200%" height="500%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <pattern id="lab-stone" patternUnits="userSpaceOnUse" width="700" height="1400">
              <image href="/tiles/calacatta.webp" width="700" height="1400" preserveAspectRatio="none" />
            </pattern>
          </defs>
          <ellipse cx="330" cy="300" rx="170" ry="26" className="lab-glow" filter="url(#lab-blur)" />
          <rect x="0" y="300" width="700" height="42" fill="url(#lab-stone)" />
          <rect x="0" y="342" width="700" height="10" className="lab-counter-edge" />
          <g className="lab-pan">
            <path d="M170 300H490Q500 300 498 290L486 214H174L162 290Q160 300 170 300Z" className="lab-ink" />
            <path d="M486 226H668Q680 226 680 238Q680 250 668 250H490Z" className="lab-ink" />
          </g>
        </svg>
      </div>
      <DemoNote topic="tests" />
    </section>
  )
}

/* ------------------------------------------------------------------ hardness */

const MOHS: [string, number, boolean?][] = [
  ['Talc', 1],
  ['A fingernail', 2.5],
  ['Marble', 3],
  ['A copper coin', 3.5],
  ['A steel knife', 5.5],
  ['Window glass', 5.5],
  ['Orvane porcelain', 7, true],
  ['Quartz sand', 7],
  ['Diamond', 10],
]

function Hardness() {
  return (
    <section className="sh-sec lab-hard" aria-labelledby="lab-hard-title">
      <header className="sh-head">
        <h2 id="lab-hard-title" className="head" data-rv>
          Harder than a knife.
        </h2>
        <p className="lead" data-rv>
          On the Mohs scale, a knife drawn across the surface leaves nothing. Only grit carried in on shoes is as hard,
          which is why a doormat matters more than the finish.
        </p>
      </header>
      <ol className="lab-mohs">
        {MOHS.map(([name, v, us]) => (
          <li key={name} className={us ? 'is-us' : undefined} data-rv>
            <span>{name}</span>
            <i style={{ ['--v' as string]: v / 10 }} aria-hidden />
            <b className="num">{v}</b>
          </li>
        ))}
      </ol>
      <DemoNote topic="tests" />
    </section>
  )
}

/* ------------------------------------------------------------------ gloss */

const BY_GLOSS = [...FINISHES].sort((a, b) => a.gloss - b.gloss)

function Gloss() {
  const [i, setI] = useState(BY_GLOSS.length - 1)
  const [held, setHeld] = useState(false)
  const f = BY_GLOSS[i]

  // the meter walks the finishes on its own until a visitor picks one
  useEffect(() => {
    if (held || reduce()) return
    const id = setInterval(() => {
      if (!document.hidden) setI((x) => (x + 1) % BY_GLOSS.length)
    }, 3200)
    return () => clearInterval(id)
  }, [held])

  return (
    <section className="lab-gloss tone-dark" aria-labelledby="lab-gloss-title" data-zone="dark">
      <div className="lab-gloss-text">
        <h2 id="lab-gloss-title" className="head" data-rv>
          One stone, eight finishes.
        </h2>
        <p className="lead" data-rv>
          Nero Marquina under one light, read by a gloss meter at 60°. From a mirror to a grip you can feel.
        </p>
        <div className="lab-gloss-pick" role="radiogroup" aria-label="Finish" data-rv>
          {BY_GLOSS.map((x, k) => (
            <button
              key={x.id}
              role="radio"
              aria-checked={k === i}
              onClick={() => {
                setHeld(true)
                setI(k)
              }}
              data-cursor="hover"
            >
              {x.name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={f.id} className="lab-gloss-read" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <p className="lab-gloss-gu num">
              {f.gloss}
              <small>GU</small>
            </p>
            <p>
              <strong>{f.name}.</strong> {f.note} Slip {f.slip}.
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="lab-meter" aria-hidden>
          {BY_GLOSS.map((x) => (
            <i key={x.id} style={{ left: `${x.gloss}%` }} />
          ))}
          <b style={{ left: `${f.gloss}%` }} />
          <span>0</span>
          <span>100 GU</span>
        </div>
      </div>
      <figure className="lab-frame">
        {BY_GLOSS.map((x, k) => (
          <img
            key={x.id}
            src={`/renders/show/lab-${x.id}.jpg`}
            alt={k === i ? `Nero Marquina in the ${x.name} finish, under a raking light` : ''}
            width={1200}
            height={1200}
            loading="lazy"
            data-on={k === i ? '' : undefined}
          />
        ))}
        <figcaption>
          {f.name} · {f.gloss} gloss units
        </figcaption>
      </figure>
    </section>
  )
}
