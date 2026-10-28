import { useRef, useState } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { LiquidGlass } from '../components/LiquidGlass'
import { CERTIFICATIONS, FACTS, FAIRS } from '../data/site'
import { num } from '../lib/format'
import { gsap, MOTION, useGSAP } from '../motion/gsap'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import { useTone } from '../motion/useTone'
import './factory.css'

// The factory: the kiln full-bleed in the dark, then the line itself, station
// by station, as a pinned sideways scroll with a counter; the numbers; who
// certifies it; where to meet us. Every figure and certificate is sample data
// for the demo.

const STATIONS = [
  {
    name: 'Press',
    img: '/renders/stack.jpg',
    ratio: '3 / 4',
    text: 'Spray-dried porcelain clay is pressed into a slab body under several thousand tonnes, then dried.',
  },
  {
    name: 'Print',
    img: '/renders/portrait-onice.jpg',
    ratio: '3 / 4',
    text: 'Inkjet heads print the design in up to eight faces, so the slabs in one crate never repeat.',
  },
  {
    name: 'Kiln',
    img: '/renders/kiln.jpg',
    ratio: '16 / 9',
    text: 'A roller kiln a hundred metres long fires each slab at 1,210 °C in a cycle of about an hour.',
  },
  {
    name: 'Polish',
    img: '/renders/polish.jpg',
    ratio: '1 / 1',
    text: 'Glossy slabs pass under the polishing heads until a bar of light reads on them as one clean line.',
  },
  {
    name: 'Sort',
    img: '/renders/row.jpg',
    ratio: '16 / 9',
    text: 'Every slab is checked for size, flatness and shade, and graded before it is allowed to leave.',
  },
  {
    name: 'Pack',
    img: '/renders/rack.jpg',
    ratio: '16 / 10',
    text: 'Shade and caliber go on the crate, and the crates are loaded into the container at our gate.',
  },
]

export default function FactoryPage() {
  const root = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  useReveal(root)
  useTone(root)

  useGSAP(() => {
    gsap.matchMedia().add(`${MOTION} and (min-width: 900px)`, () => {
      const q = gsap.utils.selector(root)
      const track = q('.fac-track')[0] as HTMLElement
      const pin = q('.fac-line')[0] as HTMLElement
      const bar = q('.fac-progress b')[0] as HTMLElement
      let last = 0
      gsap.to(track, {
        x: () => -(track.scrollWidth - track.parentElement!.clientWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${track.scrollWidth - track.parentElement!.clientWidth}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`
            const i = Math.min(STATIONS.length - 1, Math.floor(self.progress * STATIONS.length))
            if (i !== last) setAt((last = i))
          },
        },
      })
      // the kiln settles as the page opens, then sinks slowly as you leave it
      gsap.fromTo(q('.fac-hero img'), { scale: 1.12 }, { scale: 1, duration: 2.6, ease: 'expo.out' })
      gsap.to(q('.fac-hero-media'), {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: q('.fac-hero')[0], start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.fromTo(
        q('.fac-visit-bg'),
        { yPercent: -10 },
        { yPercent: 10, ease: 'none', scrollTrigger: { trigger: q('.fac-visit')[0], start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    })
  }, root)

  return (
    <div className="fac" ref={root}>
      <section className="fac-hero" aria-labelledby="fac-title" data-zone="dark">
        <div className="fac-hero-media">
          <img src="/renders/kiln.jpg" alt="Slabs riding a roller line into the glowing mouth of a kiln" width={2400} height={1350} />
        </div>
        <p className="kicker mono fac-kicker" data-rv>
          <span>The factory</span>
          <span>Morbi, Gujarat</span>
          <span>22.82° N 70.84° E</span>
        </p>
        <div className="fac-hero-text">
          <h1 id="fac-title" className="fac-title o-lines" data-rv>
            <span>
              <span>One line,</span>
            </span>
            <span>
              <span>clay to crate.</span>
            </span>
          </h1>
          <p className="lead" data-rv>
            Every Orvane slab is pressed, printed, fired, polished and packed under one roof, so the shade and the
            caliber hold from the first container to the fortieth.
          </p>
        </div>
      </section>

      {/* the wrapper belongs to React; ScrollTrigger's pin-spacer goes inside it */}
      <div className="fac-line-wrap">
        <section className="fac-line" aria-labelledby="line-title">
          <div className="fac-clip">
            <div className="fac-track">
              <div className="fac-intro">
                <p className="mono muted">Six stations · about a day from press to crate</p>
                <h2 id="line-title" className="fac-line-title">
                  The line
                </h2>
              </div>
              {STATIONS.map((s, i) => (
                <article key={s.name} className="fac-station">
                  <figure style={{ aspectRatio: s.ratio }}>
                    <img src={s.img} alt="" loading="lazy" />
                  </figure>
                  <p className="fac-no mono">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="title">{s.name}</h3>
                  <p className="fac-text">{s.text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="fac-progress mono" aria-hidden>
            <span>{String(at + 1).padStart(2, '0')}</span>
            <i>
              <b />
            </i>
            <span>{STATIONS[at].name}</span>
          </div>
        </section>
      </div>

      <section className="fac-facts" aria-labelledby="facts-title">
        <header className="fac-facts-head">
          <h2 id="facts-title" className="head" data-rv>
            In numbers
          </h2>
          <p className="mono muted" data-rv>
            Sample figures for a demo company
          </p>
        </header>
        <dl>
          {FACTS.map((f) => (
            <div key={f.unit} data-rv>
              <dt>{f.label}</dt>
              <dd>
                <AnimatedNumber value={f.value} format={num} />
                <small>{f.unit}</small>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="fac-trust" aria-labelledby="trust-title">
        <figure className="fac-trust-fig" data-rv>
          <img src="/renders/portrait-travertino.jpg" alt="Travertino Classico in the showroom" width={1080} height={1440} loading="lazy" />
        </figure>
        <div className="fac-trust-body">
          <h2 id="trust-title" className="head" data-rv>
            Certified, and on the road.
          </h2>
          <div className="fac-lists">
            <section data-rv>
              <h3 className="mono muted">Certificates</h3>
              <ul>
                {CERTIFICATIONS.map((c) => (
                  <li key={c.name}>
                    <span className="fac-item">{c.name}</span>
                    <span className="muted">{c.note}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section data-rv>
              <h3 className="mono muted">Fairs this year</h3>
              <ul>
                {FAIRS.map((f) => (
                  <li key={f.name}>
                    <span className="fac-item">{f.name}</span>
                    <span className="muted">{f.place}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <p className="mono muted">Certificates are sample data; a real manufacturer lists its own.</p>
        </div>
      </section>

      <section className="fac-visit" aria-labelledby="visit-title" data-zone="dark">
        <img className="fac-visit-bg" src="/renders/row.jpg" alt="" width={2400} height={1350} loading="lazy" />
        <h2 id="visit-title" className="fac-title o-lines" data-rv>
          <span>
            <span>Walk the line</span>
          </span>
          <span>
            <span>with us.</span>
          </span>
        </h2>
        <LiquidGlass className="fac-visit-card" radius={28} strength={24}>
          <p>Visits run Monday to Saturday, with a car from Rajkot or Ahmedabad airport.</p>
          <TLink className="btn btn-light btn-arrow" to="/quote?for=visit" data-cursor="hover">
            Book a visit
          </TLink>
        </LiquidGlass>
      </section>
    </div>
  )
}
