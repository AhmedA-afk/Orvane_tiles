import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { productById, sizeById, type Finish } from '../data/catalog'
import { BRAND } from '../data/site'
import { EASE_OUT } from '../lib/format'
import { Magnetic } from '../motion/Magnetic'
import { Split } from '../motion/Split'
import { DESIGNS, tileSrc } from '../textures/designs'
import { useRelief } from '../textures/relief'
import { gsap, MOTION, useGSAP } from '../motion/gsap'
import './Hero.css'

const HERO_PRODUCTS = ['statuario-8016', 'calacatta-6012', 'nero-6012', 'travertino-6012']
const FINISH_OPTIONS: Finish[] = ['Glossy', 'Matt', 'Carving']
const LINES = ['Porcelain slabs', 'from Morbi,', 'packed for', 'your port.']

export function Hero() {
  const [productId, setProductId] = useState(HERO_PRODUCTS[0])
  const [finish, setFinish] = useState<Finish>('Glossy')
  const product = productById(productId)!
  const root = useRef<HTMLElement>(null)

  // Leaving (the reticulos.com hero move): the lines part company as the page
  // scrolls away, the copy lifts and fades, and the slab drifts up.
  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      const q = gsap.utils.selector(root)
      const leave = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
      q('.hero-line').forEach((line: Element, i: number) =>
        gsap.to(line, { xPercent: i % 2 ? 12 : -12, ease: 'none', scrollTrigger: leave }),
      )
      gsap.to(q('.hero-body'), { y: -60, autoAlpha: 0, ease: 'none', scrollTrigger: { ...leave, end: '45% top' } })
      gsap.to(q('.hero-stage'), { y: -80, ease: 'none', scrollTrigger: leave })
    })
  }, root)

  return (
    <section className="hero" id="top" ref={root}>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1 className="display hero-title" aria-label={LINES.join(' ')}>
            {LINES.map((line, i) => (
              <span
                key={line}
                className={`hero-line ${i % 2 ? 'drop' : 'rise'}`}
                style={{ '--delay': `${0.08 + i * 0.12}s` } as CSSProperties}
              >
                <Split text={line} />
              </span>
            ))}
          </h1>
          <div className="hero-body">
            <p className="lede">
              Glazed vitrified, PGVT and full-body porcelain tiles up to 800 × 1600 mm, shipped by the container
              from Mundra. Every design has a spec sheet and a packing list, and quotes come back on WhatsApp.
            </p>
            <div className="hero-ctas">
              <Magnetic to="/collections">Browse the collections</Magnetic>
              <Magnetic to="/quote" variant="line">
                Get a container quote
              </Magnetic>
            </div>
          </div>
        </div>

        <div className="hero-stage">
          <Slab design={product.design} finish={finish} productId={productId} />

          <div className="hero-controls">
            <fieldset className="hero-designs">
              <legend className="visually-hidden">Design</legend>
              {HERO_PRODUCTS.map((id) => {
                const p = productById(id)!
                return (
                  <button
                    key={id}
                    className="swatch"
                    aria-pressed={id === productId}
                    onClick={() => setProductId(id)}
                    title={p.name}
                  >
                    <span
                      className="swatch-face"
                      style={{ backgroundColor: DESIGNS[p.design].base, backgroundImage: `url(${tileSrc(p.design, 'sm')})` }}
                    />
                    <span className="visually-hidden">{p.name}</span>
                  </button>
                )
              })}
            </fieldset>
            <div className="segmented" role="radiogroup" aria-label="Finish">
              {FINISH_OPTIONS.map((f) => (
                <button key={f} role="radio" aria-checked={f === finish} onClick={() => setFinish(f)}>
                  {f === finish && (
                    <motion.span
                      className="segmented-thumb"
                      layoutId="finish-thumb"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="segmented-label">{f}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="hero-hint">Run a cursor or finger across the slab to read the finish under light.</p>
        </div>
      </div>
    </section>
  )
}

function Slab({ design, finish, productId }: { design: string; finish: Finish; productId: string }) {
  const reduce = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const hovering = useRef(false)

  // light position, 0..1 across the slab
  const lx = useMotionValue(0.3)
  const ly = useMotionValue(0.28)
  const sx = useSpring(lx, { stiffness: 120, damping: 20, mass: 0.6 })
  const sy = useSpring(ly, { stiffness: 120, damping: 20, mass: 0.6 })

  useAnimationFrame((t) => {
    if (hovering.current || reduce) return
    lx.set(0.5 + Math.sin(t / 2600) * 0.32)
    ly.set(0.34 + Math.cos(t / 3400) * 0.16)
  })

  const onMove = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect()
    hovering.current = true
    lx.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
    ly.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
  }

  const rotateY = useTransform(sx, [0, 1], reduce ? [0, 0] : [-9, 9])
  const rotateX = useTransform(sy, [0, 1], reduce ? [0, 0] : [6, -6])
  const hx = useTransform(sx, [0, 1], [0, 100])
  const hy = useTransform(sy, [0, 1], [0, 100])
  const band = useTransform(sx, [0, 1], [-30, 60])
  const band2 = useTransform(sx, [0, 1], [-25, 65])
  const band3 = useTransform(sx, [0, 1], [-19, 71])
  const band4 = useTransform(sx, [0, 1], [-15, 75])
  const band5 = useTransform(sx, [0, 1], [-12, 78])
  const shadowX = useTransform(sx, [0, 1], [26, -26])
  const reliefR = useTransform(sx, [0.15, 0.85], [0, 1])
  const reliefL = useTransform(sx, [0.15, 0.85], [1, 0])

  const gloss = useMotionTemplate`radial-gradient(22% 13% at ${hx}% ${hy}%, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.35) 40%, rgb(255 255 255 / 0) 100%), linear-gradient(104deg, transparent ${band}%, rgb(255 255 255 / 0.3) ${band2}%, transparent ${band3}%, rgb(255 255 255 / 0.12) ${band4}%, transparent ${band5}%)`
  const matt = useMotionTemplate`radial-gradient(75% 50% at ${hx}% ${hy}%, rgb(255 255 255 / 0.22), rgb(255 255 255 / 0) 70%)`
  const falloff = useMotionTemplate`radial-gradient(130% 90% at ${hx}% ${hy}%, rgb(0 0 0 / 0) 35%, rgb(10 16 28 / 0.24) 100%)`

  const relief = useRelief(design, finish === 'Carving' && !!DESIGNS[design].normal)

  return (
    <div
      className="slab-stage"
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={() => (hovering.current = false)}
    >
      <motion.div className="slab-shadow" style={{ x: shadowX }} aria-hidden />
      <motion.div
        className="slab"
        data-finish={finish.toLowerCase()}
        style={{ rotateX, rotateY }}
        initial={{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.05 }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
        transition={{ duration: 1.15, delay: 0.25, ease: EASE_OUT }}
        role="img"
        aria-label={`${DESIGNS[design].name} slab, ${finish.toLowerCase()} finish`}
      >
        <div className="slab-base" style={{ backgroundColor: DESIGNS[design].base }} />
        <AnimatePresence initial={false}>
          <motion.img
            key={design}
            className="slab-tex"
            src={tileSrc(design)}
            alt=""
            draggable={false}
            fetchPriority="high"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ opacity: 0, transition: { delay: 0.6, duration: 0.01 } }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          />
        </AnimatePresence>
        {relief && (
          <>
            <motion.div
              className="slab-relief"
              style={{ backgroundImage: `url(${relief.left})`, opacity: finish === 'Carving' ? reliefL : 0 }}
            />
            <motion.div
              className="slab-relief"
              style={{ backgroundImage: `url(${relief.right})`, opacity: finish === 'Carving' ? reliefR : 0 }}
            />
          </>
        )}
        <motion.div className="slab-light slab-falloff" style={{ background: falloff }} />
        <motion.div
          className="slab-light"
          style={{ background: gloss }}
          animate={{ opacity: finish === 'Glossy' ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="slab-light"
          style={{ background: matt }}
          animate={{ opacity: finish === 'Glossy' ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      <CartonLabel productId={productId} finish={finish} />
    </div>
  )
}

function CartonLabel({ productId, finish }: { productId: string; finish: Finish }) {
  const p = productById(productId)!
  const size = sizeById(p.size)
  const rows: [string, string][] = [
    ['Size', `${size.label} mm`],
    ['Body', p.body],
    ['Finish', finish],
    ['Grade', 'Premium'],
    ['Pcs / box', String(size.pcsPerBox)],
    ['m² / box', size.sqmPerBox.toFixed(2)],
  ]
  // a barcode-like strip, stable per design
  const bars = useMemo(() => {
    let seed = productId.length * 97 + productId.charCodeAt(0)
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    let x = 0
    const out: { x: number; w: number }[] = []
    while (x < 118) {
      const w = 0.8 + Math.floor(r() * 3) * 0.9
      out.push({ x, w })
      x += w + 0.8 + r() * 1.6
    }
    return out
  }, [productId])

  return (
    <motion.div
      className="carton"
      initial={{ opacity: 0, scale: 1.25, rotate: -7 }}
      animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
      transition={{ delay: 1.05, type: 'spring', stiffness: 380, damping: 22 }}
      aria-live="polite"
    >
      <div className="carton-head">
        <span>{BRAND}</span>
        <span>Made in India</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={productId + finish}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <p className="carton-name">{p.name}</p>
          <dl className="carton-grid">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </AnimatePresence>
      <svg className="carton-code" viewBox="0 0 120 22" preserveAspectRatio="none" aria-hidden>
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y="0" width={b.w} height="22" fill="currentColor" />
        ))}
      </svg>
    </motion.div>
  )
}
