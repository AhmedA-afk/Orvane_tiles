import { motion } from 'motion/react'
import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { LiquidGlass } from '../components/LiquidGlass'
import { CONTAINERS, SIZES, containerLoad, sizeById, type ContainerId, type SizeId } from '../data/catalog'
import { ROUTES } from '../data/site'
import { num, num1 } from '../lib/format'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import './export.css'

const ContainerScene = lazy(() => import('../three/ContainerScene'))

// Export: a container loading itself live, the figures beside it; then how
// long the sea takes, as one bar per port; and the papers that travel with
// every load.

const REGIONS: Record<string, string> = {
  Sohar: 'Gulf',
  'Jebel Ali': 'Gulf',
  Dammam: 'Gulf',
  Mombasa: 'East Africa',
  Novorossiysk: 'Black Sea',
  Houston: 'Americas',
  Santos: 'Americas',
  Manzanillo: 'Americas',
}

const DOCS = [
  ['Commercial invoice', 'with HS code 6907 and the agreed Incoterm'],
  ['Packing list', 'boxes, pallets and weights, crate by crate'],
  ['Certificate of origin', 'for duty preferences in your market'],
  ['Bill of lading', 'from the line, released on payment'],
  ['Test reports', 'water absorption and breaking strength, on request'],
]

const LONGEST = Math.max(...ROUTES.map((r) => r.days))

export default function ExportPage() {
  const [sizeId, setSizeId] = useState<SizeId>('800x1600')
  const [container, setContainer] = useState<ContainerId>('20ft')
  const size = sizeById(sizeId)
  const load = containerLoad(size, container)
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  return (
    <div className="exp" ref={root}>
      <section className="exp-load" aria-labelledby="exp-title">
        <div className="exp-stage">
          <Suspense fallback={null}>
            <ContainerScene container={container} pallets={load.pallets} />
          </Suspense>
          <p className="exp-hint mono">Drag to look inside</p>
        </div>
        <div className="exp-side">
          <p className="kicker mono" data-rv>
            <span>Export</span>
            <span>FOB Mundra or CIF</span>
          </p>
          <h1 id="exp-title" className="exp-title o-lines" data-rv>
            <span>
              <span>One container,</span>
            </span>
            <span>
              <span>planned to the kilo.</span>
            </span>
          </h1>
          <p className="exp-lede" data-rv>
            Tile reaches a container’s weight limit long before it fills the space, so every Orvane load is planned
            by weight. Pick a size and a container and watch it load.
          </p>

          <div className="exp-controls" data-rv>
            <div className="chips" role="radiogroup" aria-label="Tile size">
              {SIZES.map((s) => (
                <button key={s.id} role="radio" aria-checked={s.id === sizeId} onClick={() => setSizeId(s.id)} data-cursor="hover">
                  {s.label}
                </button>
              ))}
            </div>
            <div className="seg" role="radiogroup" aria-label="Container">
              {(Object.keys(CONTAINERS) as ContainerId[]).map((c) => (
                <button key={c} role="radio" aria-checked={c === container} onClick={() => setContainer(c)} data-cursor="hover">
                  {c === container && (
                    <motion.span className="seg-thumb" layoutId="exp-container" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                  )}
                  <span>{CONTAINERS[c].label} container</span>
                </button>
              ))}
            </div>
          </div>

          <dl className="exp-figures" aria-live="polite">
            <div>
              <dt>square metres</dt>
              <dd>
                <AnimatedNumber value={load.sqm} format={num} />
              </dd>
            </div>
            <div>
              <dt>boxes of {size.pcsPerBox}</dt>
              <dd>
                <AnimatedNumber value={load.boxes} format={num} />
              </dd>
            </div>
            <div>
              <dt>crates</dt>
              <dd>
                <AnimatedNumber value={load.pallets} format={num} />
              </dd>
            </div>
            <div>
              <dt>tonnes</dt>
              <dd>
                <AnimatedNumber value={load.kg / 1000} format={num1} />
              </dd>
            </div>
          </dl>
          <div className="exp-share" aria-hidden>
            <span>
              Payload <b className="mono">{Math.round(load.weightShare * 100)}%</b>
              <i>
                <em style={{ transform: `scaleX(${load.weightShare})` }} />
              </i>
            </span>
            <span>
              Space <b className="mono">{Math.round(load.volumeShare * 100)}%</b>
              <i>
                <em style={{ transform: `scaleX(${load.volumeShare})` }} />
              </i>
            </span>
          </div>
          <p className="exp-note mono muted">
            {Math.round(load.weightShare * 100)}% of the payload, {Math.round(load.volumeShare * 100)}% of the space.
            Indicative for {size.thickness} mm tile; your quote confirms the packing list.
          </p>
        </div>
      </section>

      <section className="exp-sea" aria-labelledby="sea-title">
        <header className="exp-sea-head">
          <h2 id="sea-title" className="head o-lines" data-rv>
            <span>
              <span>Days at sea</span>
            </span>
            <span>
              <span>from Mundra.</span>
            </span>
          </h2>
          <p className="muted" data-rv>
            Mundra is a day’s drive from the factory. Times are indicative and depend on the line and its
            transhipments.
          </p>
        </header>

        <figure className="exp-film" data-rv>
          <video autoPlay muted loop playsInline preload="metadata" poster="/images/world/terminal-poster.jpg" aria-hidden="true">
            <source src="/images/world/terminal.webm" type="video/webm" />
            <source src="/images/world/terminal.mp4" type="video/mp4" />
          </video>
          <LiquidGlass className="exp-film-tag" strength={16}>
            <span className="mono">Container terminal · footage by the USDA, public domain</span>
          </LiquidGlass>
        </figure>

        <ol className="exp-bars" aria-label="Indicative days at sea from Mundra, by port">
          {ROUTES.map((r) => (
            <li key={r.port} data-rv>
              <span className="exp-port">
                {r.port}
                <span className="muted">, {r.country}</span>
              </span>
              <span className="exp-region mono">{REGIONS[r.port]}</span>
              <span className="exp-bar" aria-hidden>
                <i style={{ ['--d' as string]: r.days / LONGEST }} />
              </span>
              <span className="exp-days">
                {r.days}
                <small> days</small>
              </span>
            </li>
          ))}
        </ol>

        <div className="exp-photos">
          <figure data-rv>
            <img
              src="/images/world/mundra-port.jpg"
              alt="Gantry cranes and tugboats at the port of Mundra, Gujarat"
              width={2000}
              height={1500}
              loading="lazy"
            />
            <figcaption className="mono">The port of Mundra, a day’s drive from the factory</figcaption>
          </figure>
          <figure data-rv>
            <img
              src="/images/world/leaving-mundra.jpg"
              alt="Containers stacked on a ship's deck as it sails out of Mundra past the cranes"
              width={1600}
              height={1200}
              loading="lazy"
            />
            <figcaption className="mono">Leaving Mundra for the Gulf</figcaption>
          </figure>
        </div>
      </section>

      <section className="exp-docs" aria-labelledby="docs-title">
        <figure className="exp-docs-fig" data-rv>
          <img src="/renders/rack.jpg" alt="Finished slabs on an A-frame, waiting to be crated" width={1920} height={1200} loading="lazy" />
        </figure>
        <div className="exp-docs-body">
          <h2 id="docs-title" className="head" data-rv>
            The papers that travel with it.
          </h2>
          <ul>
            {DOCS.map(([k, v]) => (
              <li key={k} data-rv>
                <span className="exp-doc">{k}</span>
                <span className="muted">{v}</span>
              </li>
            ))}
          </ul>
          <TLink className="btn btn-ink btn-arrow" to="/quote?for=price" data-rv data-cursor="hover">
            Ask for a container price
          </TLink>
        </div>
      </section>
    </div>
  )
}
