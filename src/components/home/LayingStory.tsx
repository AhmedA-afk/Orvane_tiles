import { useRef, useState, type CSSProperties } from 'react'
import { useLayoutEffect } from 'react'
import { Magnetic } from '../../motion/Magnetic'
import { gsap, MOTION, useGSAP } from '../../motion/gsap'
import './LayingStory.css'

// The home page's one big move. The screen is a bare screed floor seen from
// above; scrolling lays 800 × 1600 Statuario slabs across it course by course,
// book-matched so the veins run on across the joints. Three short facts change
// as the floor fills, then the finished floor tilts back into perspective and
// hands over to the visualizer. Pinned, and the scroll is the animation.
// Without motion the floor is simply laid and every fact is listed.

const FACES = 6

const STEPS = [
  { k: 'Up to 800 × 1600 mm', text: 'Six formats with rectified edges, so the grout line stays a hairline.' },
  { k: 'Four bodies', text: 'GVT, PGVT, double charge and full-body porcelain, from wall tiles to slabs.' },
  {
    k: 'Graded and boxed',
    text: 'Each slab sorted by shade and caliber, packed at the factory and shipped from Mundra.',
  },
]

function useFloor() {
  const [floor, setFloor] = useState({ cols: 6, rows: 3 })
  useLayoutEffect(() => {
    const measure = () => {
      const cols = window.innerWidth < 700 ? 3 : window.innerWidth < 1200 ? 5 : 6
      const tileH = (window.innerWidth / cols) * 2
      setFloor({ cols, rows: Math.ceil(window.innerHeight / tileH) + 1 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return floor
}

export function LayingStory() {
  const root = useRef<HTMLElement>(null)
  const { cols, rows } = useFloor()

  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      const el = root.current!
      el.classList.add('is-live')
      const q = gsap.utils.selector(el)
      const tiles = q('.lay-tile')
      const steps = q('.lay-step')
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: el, start: 'top top', end: '+=280%', pin: true, scrub: 0.8, anticipatePin: 1 },
      })
      // lay the floor from the near-left corner, course by course
      tl.from(
        tiles,
        {
          autoAlpha: 0,
          yPercent: -18,
          scale: 1.06,
          duration: 0.5,
          stagger: { grid: [rows, cols], from: 'end', amount: 1.6 },
        },
        0,
      )
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 24 })
      steps.slice(1).forEach((s: Element, i: number) => {
        tl.to(steps[i], { autoAlpha: 0, y: -24, duration: 0.25 }, 1.05 + i * 1.05)
        tl.to(s, { autoAlpha: 1, y: 0, duration: 0.3 }, 1.15 + i * 1.05)
      })
      // the finished floor tilts back into a room
      tl.to(steps[steps.length - 1], { autoAlpha: 0, y: -24, duration: 0.25 }, 3.2)
      tl.to(q('.lay-plane'), { rotateX: 62, scale: 1.55, yPercent: 8, duration: 1.1, ease: 'power2.inOut' }, 3.1)
      tl.fromTo(q('.lay-sheen'), { xPercent: -120 }, { xPercent: 120, duration: 1, ease: 'none' }, 3.3)
      tl.from(q('.lay-end'), { autoAlpha: 0, y: 40, duration: 0.5 }, 3.8)
      return () => el.classList.remove('is-live')
    })
  }, root)

  // Six faces cut from the scan, as a PGVT box carries several. Slabs side by
  // side are book-matched in pairs; beyond its pair no slab repeats a neighbour.
  const tiles = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const face = ((r * 4 + Math.floor(c / 2) * 2) % FACES) + 1
      tiles.push(
        <i key={`${r}-${c}`} className="lay-tile">
          <b
            style={{
              backgroundImage: `url(/tiles/statuario-f${face}.webp)`,
              transform: c % 2 ? 'scaleX(-1)' : undefined,
            }}
          />
        </i>,
      )
    }

  // The wrapper belongs to React; ScrollTrigger's pin-spacer goes inside it, so
  // leaving the page never asks React to remove a node GSAP has moved.
  return (
    <div className="lay-wrap">
      <section className="lay" ref={root} aria-labelledby="lay-title">
        <div className="lay-view" aria-hidden>
          <div className="lay-plane" style={{ '--cols': cols } as CSSProperties}>
            {tiles}
            <div className="lay-sheen" />
          </div>
        </div>

        <div className="lay-copy">
          <h2 id="lay-title" className="visually-hidden">
            What goes into every floor
          </h2>
          <ul className="lay-steps">
            {STEPS.map((s) => (
              <li key={s.k} className="lay-step">
                <strong>{s.k}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lay-end">
          <p className="lay-end-title">Now see it in a room.</p>
          <Magnetic to="/visualizer">Open the visualizer</Magnetic>
        </div>
      </section>
    </div>
  )
}
