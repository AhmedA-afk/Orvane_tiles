import type { CSSProperties } from 'react'
import { CERTIFICATIONS, FACTS, FAIRS } from '../data/site'
import { num } from '../lib/format'
import { DESIGNS, tileSrc } from '../textures/designs'
import { AnimatedNumber } from './AnimatedNumber'
import './Factory.css'

const STATIONS = [
  { name: 'Press', from: 2, to: 13 },
  { name: 'Digital print', from: 17, to: 29 },
  { name: 'Kiln', from: 33, to: 63 },
  { name: 'Polish', from: 67, to: 77 },
  { name: 'Sort', from: 80, to: 88 },
  { name: 'Pack', from: 91, to: 99 },
]

const STEPS = [
  { title: 'Press', text: 'Spray-dried porcelain clay is pressed into the slab body under several thousand tonnes.' },
  { title: 'Digital print', text: 'Inkjet heads print the design in several faces, so tiles in one box don’t repeat.' },
  { title: 'Kiln', text: 'A roller kiln fires each slab at about 1,200 °C in a cycle of roughly an hour.' },
  { title: 'Polish', text: 'PGVT slabs are polished to a mirror finish. Matt and carving finishes skip this step.' },
  { title: 'Sort', text: 'Each slab is checked for size, flatness and shade, then graded Premium or Standard.' },
  { title: 'Pack', text: 'Shade and caliber go on the carton, and pallets are loaded at the factory gate.' },
]

const TILE_COUNT = 9
const DESIGN_CYCLE = ['statuario', 'calacatta', 'nero', 'armani', 'travertino', 'onice']

export function Factory() {
  return (
    <section className="factory" id="factory" aria-label="Production line">
      <div className="wrap">

        <div className="line-scroll">
          <div className="line" aria-hidden>
            <div className="line-stations">
              {STATIONS.map((s) => (
                <div
                  key={s.name}
                  className="station"
                  data-kind={s.name.toLowerCase().split(' ')[0]}
                  style={{ left: `${s.from}%`, width: `${s.to - s.from}%` } as CSSProperties}
                >
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
            <div className="belt">
              {Array.from({ length: TILE_COUNT }, (_, i) => (
                <LineTile key={i} index={i} design={DESIGN_CYCLE[i % DESIGN_CYCLE.length]} />
              ))}
              <div className="press-plate" />
              <div className="kiln-roof" />
            </div>
          </div>
        </div>

        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-n num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="proof">
          <dl className="facts">
            {FACTS.map((f) => (
              <div key={f.unit}>
                <dt>{f.label}</dt>
                <dd>
                  <AnimatedNumber value={f.value} format={num} /> <span className="facts-unit">{f.unit}</span>
                </dd>
              </div>
            ))}
            <p className="sample-note">Sample figures for this demo.</p>
          </dl>

          <div className="trust">
            <div>
              <h3>
                Certified <span className="sample-note">(sample)</span>
              </h3>
              <ul className="certs">
                {CERTIFICATIONS.map((c) => (
                  <li key={c.name}>
                    <strong>{c.name}</strong>
                    <span>{c.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Find us at</h3>
              <ul className="certs">
                {FAIRS.map((f) => (
                  <li key={f.name}>
                    <strong>{f.name}</strong>
                    <span>{f.place}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LineTile({ index, design }: { index: number; design: string }) {
  return (
    <div className="line-tile" style={{ '--d': `${-index * (18 / TILE_COUNT)}s` } as CSSProperties}>
      <div className="lt">
        <i className="lt-raw" />
        <i
          className="lt-print"
          style={{ backgroundImage: `url(${tileSrc(design, 'sm')})`, backgroundColor: DESIGNS[design].base }}
        />
        <i className="lt-glow" />
        <i className="lt-shine" />
        <i className="lt-box" />
      </div>
    </div>
  )
}
