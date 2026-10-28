import { useRef } from 'react'
import { useParams } from 'react-router'
import { DemoNote } from '../components/Demo'
import { FinishSamples } from '../components/FinishSamples'
import { InteriorImage } from '../components/Interior'
import { InteriorCarousel } from '../components/InteriorCarousel'
import { TechList } from '../components/TechList'
import { interiorsIn } from '../data/range/interiors'
import {
  designsIn,
  formatById,
  formatLabel,
  LINES,
  lineById,
  thicknessByMm,
  type Line,
  type LineId,
} from '../data/range'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import NotFound from './NotFound'
import './lines.css'

// The lines: eight sub-brands of the range, each with its formats, thicknesses,
// finishes and technologies. The index sets them side by side; a line's page
// tells its story, draws its formats to scale beside a person, and lists its
// designs.

const range = (l: Line) => {
  const fs = l.formats.map((f) => formatById(f)!)
  const big = fs.reduce((a, f) => (f.w * f.h > a.w * a.h ? f : a))
  const mm = l.thicknesses
  return `up to ${formatLabel(big)} mm · ${mm.length > 1 ? `${mm[0]}–${mm[mm.length - 1]}` : mm[0]} mm`
}

export default function Lines() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  return (
    <div className="ln" ref={root}>
      <header className="ln-head">
        <p className="kicker mono" data-rv>
          <span>The lines</span>
          <span>{LINES.length} brands of one range</span>
        </p>
        <h1 className="ln-title o-lines" data-rv>
          <span>
            <span>Eight lines.</span>
          </span>
        </h1>
        <p className="lead" data-rv>
          Each line is made for a place: the largest slabs we press, matched pairs, panels thin enough for a door,
          kitchens, baths, the outdoors, wood and texture.
        </p>
      </header>
      <ol className="ln-list">
        {LINES.map((l, i) => {
          const ds = designsIn(l.id)
          return (
            <li key={l.id} data-rv>
              <TLink to={`/lines/${l.id}`} className="ln-row" data-cursor="Open">
                <span className="ln-no mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="ln-name">{l.name}</span>
                <span className="ln-meta">
                  <b>{l.kind}</b>
                  <span>{l.tagline}</span>
                  <span className="mono muted">
                    {ds.length} designs · {range(l)}
                  </span>
                </span>
                {interiorsIn(l.id)[0] ? (
                  <span className="ln-room" aria-hidden>
                    <InteriorImage shot={interiorsIn(l.id)[0]} sizes="240px" />
                  </span>
                ) : (
                  <span className="ln-fan" aria-hidden>
                    {ds.slice(0, 4).map((d) => (
                      <img key={d.id} src={`/renders/range/${d.id}--${d.colourways[0].slug}.jpg`} alt="" width={720} height={960} loading="lazy" />
                    ))}
                  </span>
                )}
              </TLink>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function LinePage() {
  const { id = '' } = useParams()
  const l = LINES.find((x) => x.id === id)
  return l ? <LineView key={l.id} id={l.id} /> : <NotFound />
}

function LineView({ id }: { id: LineId }) {
  const l = lineById(id)
  const ds = designsIn(id)
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const formats = l.formats.map((f) => formatById(f)!)
  const xxl = formats.some((f) => f.demo)
  const next = LINES[(LINES.findIndex((x) => x.id === id) + 1) % LINES.length]

  return (
    <div className="lp" ref={root}>
      <header className="lp-head" aria-labelledby="lp-title">
        <p className="kicker mono" data-rv>
          <span>{l.kind}</span>
          <span>{ds.length} designs</span>
          <span>{range(l)}</span>
        </p>
        <div className="lp-head-row">
          <h1 id="lp-title" className="lp-title o-lines" data-rv>
            <span>
              <span>{l.name}</span>
            </span>
          </h1>
          <div className="lp-head-side" data-rv>
            <p className="lp-tag">{l.tagline}</p>
            <p className="lp-story">{l.story}</p>
          </div>
        </div>
      </header>

      <InteriorCarousel shots={interiorsIn(id)} label={`Rooms in ${l.name}`} />

      <section className="lp-sec" aria-labelledby="lp-formats">
        <header className="lp-sec-head">
          <h2 id="lp-formats" className="title" data-rv>
            Formats, to scale.
          </h2>
          {xxl && <DemoNote topic="sizes" />}
        </header>
        <FormatsToScale formats={formats} />
        <ul className="lp-mm">
          {l.thicknesses.map((mm) => (
            <li key={mm} data-rv>
              <b>{mm} mm</b>
              <span className="muted">{thicknessByMm(mm)?.uses.join(', ')}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lp-sec" aria-labelledby="lp-finishes">
        <header className="lp-sec-head">
          <h2 id="lp-finishes" className="title" data-rv>
            Finishes.
          </h2>
          <p className="muted lp-sec-note" data-rv>
            One stone, one light, every finish: rendered from the surface itself.
          </p>
        </header>
        <FinishSamples line={id} />
      </section>

      {l.techs.length > 0 && (
        <section className="lp-sec" aria-labelledby="lp-tech">
          <header className="lp-sec-head">
            <h2 id="lp-tech" className="title" data-rv>
              Technologies.
            </h2>
          </header>
          <TechList techs={l.techs} />
        </section>
      )}

      <section className="lp-sec" aria-labelledby="lp-designs">
        <header className="lp-sec-head">
          <h2 id="lp-designs" className="title" data-rv>
            {ds.length} designs.
          </h2>
          <div className="lp-apps" data-rv>
            {l.applications.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </header>
        <ul className="lp-designs">
          {ds.map((d) => (
            <li key={d.id} data-rv>
              <TLink to={`/collections/${d.id}`} data-cursor="Configure">
                <img src={`/renders/range/${d.id}--${d.colourways[0].slug}.jpg`} alt="" width={720} height={960} loading="lazy" />
                <span className="lp-d-name">{d.name}</span>
                <span className="lp-d-note mono muted">{d.note}</span>
              </TLink>
            </li>
          ))}
        </ul>
      </section>

      <TLink to={`/lines/${next.id}`} className="lp-next" data-cursor="Next">
        <span className="mono muted">Next line</span>
        <span className="lp-next-name">{next.name}</span>
        <span className="muted">{next.kind}</span>
      </TLink>
    </div>
  )
}

/** the line's formats drawn side by side at one scale, with a 1.75 m figure */
function FormatsToScale({ formats }: { formats: ReturnType<typeof formatById>[] }) {
  const fs = formats.filter(Boolean) as NonNullable<ReturnType<typeof formatById>>[]
  const maxH = Math.max(1750, ...fs.map((f) => f.h))
  const gap = 260
  const total = fs.reduce((a, f) => a + f.w + gap, 0) + 900
  const H = maxH + 520
  let x = 700
  return (
    <svg className="lp-scale" viewBox={`0 0 ${total} ${H}`} preserveAspectRatio="xMinYMax meet" role="img" aria-label={`The line's formats to scale: ${fs.map((f) => formatLabel(f)).join(', ')} mm, beside a 1.75 m figure`}>
      <line x1="0" y1={maxH + 60} x2={total} y2={maxH + 60} className="lp-floor" />
      <g transform={`translate(260 ${maxH + 60 - 1750})`} className="lp-person">
        <circle cx="0" cy="115" r="115" />
        <rect x="-170" y="260" width="340" height="1490" rx="170" />
      </g>
      <text x="260" y={maxH + 200} className="lp-cap" textAnchor="middle">
        1.75 m
      </text>
      {fs.map((f) => {
        const r = (
          <g key={f.id}>
            <rect x={x} y={maxH + 60 - f.h} width={f.w} height={f.h} rx="12" className={f.demo ? 'lp-fmt is-demo' : 'lp-fmt'} />
            <text x={x + f.w / 2} y={maxH + 200} className="lp-cap" textAnchor="middle">
              {formatLabel(f)}
            </text>
          </g>
        )
        x += f.w + gap
        return r
      })}
    </svg>
  )
}
