import { useRef } from 'react'
import { PRODUCTS } from '../../data/catalog'
import { BRAND, WHATSAPP_NUMBER } from '../../data/site'
import { Magnetic } from '../../motion/Magnetic'
import { TLink } from '../../motion/Transition'
import { useWipe } from '../../motion/useWipe'
import { gsap, MOTION, useGSAP } from '../../motion/gsap'
import { tileSrc } from '../../textures/designs'
import { ChatIcon } from '../icons'
import './Doorways.css'

// After the laying story the home page only points onward: one row per page,
// each with its own piece of real material, then a cobalt sheet asking for
// the quote.

type Visual = { kind: 'tiles'; tiles: string[] } | { kind: 'plan' } | { kind: 'carton' }

const ROWS: { to: string; title: string; line: string; visual: Visual }[] = [
  {
    to: '/collections',
    title: 'Collections',
    line: `${PRODUCTS.length} designs, filtered by size, finish, body and room.`,
    visual: { kind: 'tiles', tiles: ['calacatta', 'nero', 'onice', 'travertino'] },
  },
  {
    to: '/visualizer',
    title: 'Visualizer',
    line: 'Lay any design in a room at its true size.',
    visual: { kind: 'tiles', tiles: ['armani', 'crema', 'rovere'] },
  },
  { to: '/export', title: 'Container load', line: 'Boxes, square metres and pallets in every container.', visual: { kind: 'plan' } },
  { to: '/factory', title: 'Factory', line: 'From press to pallet on one line in Morbi.', visual: { kind: 'carton' } },
]

function DoorVisual({ v }: { v: Visual }) {
  if (v.kind === 'tiles')
    return (
      <span className="door-strip" aria-hidden>
        {v.tiles.map((t) => (
          <i key={t} style={{ backgroundImage: `url(${tileSrc(t, 'sm')})` }} />
        ))}
      </span>
    )
  if (v.kind === 'plan')
    // a 20 ft floor plan, ten pallets down and nine stacked on top
    return (
      <span className="door-strip door-plan" aria-hidden>
        <span className="plan-tier">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <span className="plan-tier plan-top">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      </span>
    )
  return (
    <span className="door-strip door-carton" aria-hidden>
      <b>{BRAND}</b>
      <strong>Statuario Bianco</strong>
      <span>800 × 1600 mm</span>
      <span>Grade Premium</span>
      <span>Shade 04, Caliber 2</span>
      <em />
    </span>
  )
}

export function Doorways() {
  const root = useRef<HTMLElement>(null)

  // each row's material slides out from behind its title as it scrolls in
  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      gsap.utils.toArray<HTMLElement>('.door', root.current).forEach((row) => {
        gsap.from(row.querySelectorAll('.door-strip > *'), {
          clipPath: 'inset(0 0 100% 0)',
          stagger: 0.06,
          duration: 1,
          scrollTrigger: { trigger: row, start: 'top 85%' },
        })
      })
    })
  }, root)

  return (
    <section className="doors" ref={root} aria-label="Explore">
      <ul className="wrap door-list">
        {ROWS.map((r) => (
          <li key={r.to}>
            <TLink to={r.to} className="door">
              <span className="door-title">{r.title}</span>
              <span className="door-line">{r.line}</span>
              <DoorVisual v={r.visual} />
            </TLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CloseCta() {
  const sheet = useRef<HTMLElement>(null)
  useWipe(sheet)
  return (
    <section className="close" ref={sheet} aria-labelledby="close-title">
      <div className="wrap close-inner">
        <h2 className="close-title" id="close-title">
          Send us your port. We’ll send back a price.
        </h2>
        <p className="close-sub">
          Pick the designs, say how many containers and where they should land. The export desk answers on WhatsApp.
        </p>
        <div className="close-ctas">
          <Magnetic to="/quote" variant="light">
            Get a container quote
          </Magnetic>
          <Magnetic
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener"
            variant="whatsapp"
            icon={<ChatIcon />}
          >
            WhatsApp the export desk
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
