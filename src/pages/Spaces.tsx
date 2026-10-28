import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { DemoNote } from '../components/Demo'
import { InteriorImage } from '../components/Interior'
import { JointCounter } from '../components/JointCounter'
import { RoomBox } from '../components/RoomBox'
import { Close, RoomsSection } from '../components/Showcase'
import { CutPlanner } from '../configurator/CutPlanner'
import { EdgeProfiles, type Edge } from '../configurator/EdgeProfiles'
import { designsIn, finishById, formatById, lineById } from '../data/range'
import { roomsOf, spaceById, SPACES, type Space } from '../data/spaces'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import { useTone } from '../motion/useTone'
import NotFound from './NotFound'
import './design.css'
import './showcase.css'

// The spaces: the index sets the five rooms of a house side by side as
// photographs at different sizes; each space opens on its room, then shows
// its rooms, the one thing a buyer for that room needs to see working, and
// the lines made for it.

export default function Spaces() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  return (
    <div className="sh sp" ref={root}>
      <header className="tc-head">
        <h1 className="tc-title o-lines" data-rv>
          <span>
            <span>Spaces.</span>
          </span>
        </h1>
        <p className="lead" data-rv>
          Five places stone has to work hard, each with the lines, finishes and thicknesses made for it.
        </p>
      </header>
      <ul className="sp-index">
        {SPACES.map((s) => {
          const rooms = roomsOf(s)
          return (
            <li key={s.id} className={`sp-card sp-card-${s.id}`} data-rv>
              <TLink to={`/spaces/${s.id}`} data-cursor="Open">
                <span className="sp-card-pic">
                  <InteriorImage shot={rooms[0]} sizes="(min-width: 900px) 60vw, 100vw" />
                </span>
                <span className="sp-card-name">{s.name}</span>
                <span className="sp-card-say">
                  {rooms.length} rooms · {s.lines.map((l) => lineById(l).name).join(', ')}
                </span>
              </TLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function SpacePage() {
  const { id = '' } = useParams()
  const s = spaceById(id)
  return s ? <SpaceView key={s.id} s={s} /> : <NotFound />
}

function SpaceView({ s }: { s: Space }) {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  useTone(root)
  const rooms = roomsOf(s)
  const next = SPACES[(SPACES.indexOf(s) + 1) % SPACES.length]
  return (
    <div className="sh sp" ref={root}>
      <section className="sp-hero" aria-labelledby="sp-title" data-zone="dark">
        <InteriorImage shot={rooms[0]} sizes="100vw" eager className="sp-hero-img" />
        <div className="sp-hero-text">
          <h1 id="sp-title" className="sp-title" data-rv>
            {s.title}
          </h1>
          <p className="sp-hero-lead" data-rv>
            {s.lead}
          </p>
        </div>
      </section>

      <RoomsSection id="sp-rooms" title={`${rooms.length} rooms.`} shots={rooms} showLine />

      {s.id === 'kitchens' && <Kitchen />}
      {s.id === 'bathrooms' && <Bathroom />}
      {s.id === 'living' && <Living />}
      {s.id === 'hospitality' && <Hospitality />}
      {s.id === 'outdoors' && <Outdoors />}

      <section className="sh-sec" aria-labelledby="sp-lines-title">
        <header className="sh-head">
          <h2 id="sp-lines-title" className="head" data-rv>
            The lines for it.
          </h2>
          <p className="lead" data-rv>
            Each made for this room, in the formats, thicknesses and finishes it needs.
          </p>
        </header>
        <ul className="sp-lines">
          {s.lines.map((l) => {
            const line = lineById(l)
            return (
              <li key={l} data-rv>
                <TLink to={`/lines/${l}`} className="sp-line" data-cursor="Open">
                  <span className="sp-line-name">{line.name}</span>
                  <span className="sp-line-say">
                    <b>{line.kind}</b>
                    <span>{line.tagline}</span>
                  </span>
                  <span className="sp-line-fan" aria-hidden>
                    {designsIn(l)
                      .slice(0, 4)
                      .map((d) => (
                        <img key={d.id} src={`/renders/range/${d.id}--${d.colourways[0].slug}.jpg`} alt="" width={720} height={960} loading="lazy" />
                      ))}
                  </span>
                </TLink>
              </li>
            )
          })}
        </ul>
      </section>

      <Close
        id="sp-close"
        title={`Next: ${next.name.toLowerCase()}.`}
        say={next.lead}
        fact={`${roomsOf(next).length} rooms`}
        image={
          <span className="sp-close-pic">
            <InteriorImage shot={roomsOf(next)[0]} sizes="60vw" />
          </span>
        }
        actions={[
          { to: `/spaces/${next.id}`, label: `See ${next.name.toLowerCase()}` },
          { to: '/quote', label: 'Order samples' },
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ moments */

function Kitchen() {
  const [edge, setEdge] = useState<Edge>('apron60')
  const [mm, setMm] = useState(12)
  const cal = designsIn('cucina')[0]
  return (
    <>
      <section className="sh-sec" aria-labelledby="sp-edge-title">
        <header className="sh-head">
          <h2 id="sp-edge-title" className="head" data-rv>
            The edge.
          </h2>
          <p className="lead" data-rv>
            A 45° mitre to a deep apron makes a 12 mm slab read as a block of solid stone, and the colour runs through
            the cut.
          </p>
        </header>
        <div className="sp-edge" data-rv>
          <div className="seg" role="radiogroup" aria-label="Thickness">
            {[12, 20].map((t) => (
              <button key={t} role="radio" aria-checked={t === mm} onClick={() => setMm(t)} data-cursor="hover">
                {t === mm && <span className="seg-thumb" />}
                <span>{t} mm</span>
              </button>
            ))}
          </div>
          <EdgeProfiles value={edge} onChange={setEdge} mm={mm} />
        </div>
      </section>
      <section className="sh-sec" aria-labelledby="sp-cut-title">
        <header className="sh-head">
          <h2 id="sp-cut-title" className="head" data-rv>
            From one slab.
          </h2>
          <p className="lead" data-rv>
            Set the pieces of a kitchen and see how many come out of one 1600 × 3200 mm slab, and what is left over.
          </p>
        </header>
        <div data-rv>
          <CutPlanner slab={formatById('1600x3200')!} image={`/tiles/${cal.colourways[0].sm}`} />
        </div>
      </section>
      <Facts
        id="sp-work"
        title="Built for the work."
        facts={[
          ['280 °C', 'A pan straight off the flame leaves no mark.', '/technology/surface-lab', 'Watch the test'],
          ['Class 5', 'Wine, coffee and turmeric wipe off with water.', '/technology/surface-lab', 'Spill on it'],
          ['Puro', 'An antimicrobial glaze on every Cucina surface.', '/technology', 'The technology'],
        ]}
      />
    </>
  )
}

function Bathroom() {
  const terme = lineById('terme')
  return (
    <>
      <section className="sh-sec" aria-labelledby="sp-box-title">
        <header className="sh-head">
          <h2 id="sp-box-title" className="head" data-rv>
            One stone, every surface.
          </h2>
          <p className="lead" data-rv>
            Walls, floor and vanity in one stone. Choose it and the whole room changes, joints and all.
          </p>
        </header>
        <div data-rv>
          <RoomBox />
        </div>
      </section>
      <section className="sh-sec" aria-labelledby="sp-wet-title">
        <header className="sh-head">
          <h2 id="sp-wet-title" className="head" data-rv>
            Underfoot, wet.
          </h2>
          <p className="lead" data-rv>
            Each Terme finish, its rating on the ramp, and where it belongs in a bathroom.
          </p>
        </header>
        <ul className="sp-wet">
          {terme.finishes.map((f) => {
            const x = finishById(f)
            const where: Record<string, string> = {
              presa: 'Shower floors, wet rooms and pool surrounds',
              matt: 'Bathroom floors outside the shower',
              satin: 'Walls, vanity tops and dry floors',
              glossy: 'Walls and vanity tops only',
            }
            return (
              <li key={f} data-rv>
                <img src={`/renders/finish/terme--${f}.jpg`} alt={`${x.name} finish on Travertino Celeste`} width={900} height={900} loading="lazy" />
                <b className="sp-wet-r">{x.slip}</b>
                <span>
                  <strong>{x.name}.</strong> {where[f]}.
                </span>
              </li>
            )
          })}
        </ul>
        <p className="sp-more" data-rv>
          <TLink className="u" to="/technology/surface-lab">
            Tilt each one on the ramp →
          </TLink>
        </p>
      </section>
    </>
  )
}

function Living() {
  return (
    <section className="sh-sec" aria-labelledby="sp-joints-title">
      <header className="sh-head">
        <h2 id="sp-joints-title" className="head" data-rv>
          Count the joints.
        </h2>
        <p className="lead" data-rv>
          The larger the piece, the calmer the floor. Lay your own room in a tile and in a slab.
        </p>
      </header>
      <div data-rv>
        <JointCounter stone="/tiles/calacatta.webp" />
      </div>
      <p className="sp-more" data-rv>
        <TLink className="u" to="/technology/scale">
          See the largest slab beside a person →
        </TLink>
      </p>
    </section>
  )
}

function Hospitality() {
  return (
    <>
      <section className="sh-sec sp-split" aria-labelledby="sp-match-title">
        <div className="sp-split-text">
          <h2 id="sp-match-title" className="head" data-rv>
            Matched for the lobby.
          </h2>
          <p className="lead" data-rv>
            A reception wall in bookmatched onyx, ordered as a numbered set and laid by number, so the veins meet at
            every joint.
          </p>
          <TLink className="btn btn-ink btn-arrow" to="/technology/vein" data-rv data-cursor="hover">
            See a bookmatch open
          </TLink>
        </div>
        <img className="sp-split-img" src="/renders/show/pair-azzurro.jpg" alt="Two slabs of Onice Azzurro opened as a bookmatch" width={1034} height={1920} loading="lazy" data-rv />
      </section>
      <Facts
        id="sp-foot"
        title="Thousands of footsteps."
        facts={[
          ['Mohs 7', 'Harder than steel. Only grit carried in on shoes can mark it.', '/technology/surface-lab', 'The hardness scale'],
          ['R10–R12', 'Slip ratings for entrances, bar floors and wet areas.', '/technology/surface-lab', 'The ramp'],
          ['±0.5 mm', 'Counters, bar fronts and tables cut to the drawing in Morbi.', '/quote', 'Send a drawing'],
        ]}
      />
    </>
  )
}

function Outdoors() {
  const ways = [
    { name: 'On grass', say: 'Stepping stones set straight into the lawn, no mortar.', base: 'grass' },
    { name: 'On gravel', say: 'Laid loose on a compacted gravel bed, for drives and paths.', base: 'gravel' },
    { name: 'On pedestals', say: 'Raised over a roof or terrace membrane, levelled and drained.', base: 'pedestal' },
  ] as const
  return (
    <>
      <section className="sh-sec" aria-labelledby="sp-lay-title">
        <header className="sh-head">
          <h2 id="sp-lay-title" className="head" data-rv>
            Three ways to lay it.
          </h2>
          <p className="lead" data-rv>
            Twenty millimetres is strong enough to lie without adhesive, so the outdoors goes down dry.
          </p>
        </header>
        <ul className="sp-lay">
          {ways.map((w) => (
            <li key={w.base} data-rv>
              <svg viewBox="0 0 360 170" aria-hidden className={`sp-lay-svg sp-lay-${w.base}`}>
                {w.base === 'grass' && (
                  <>
                    <rect x="0" y="96" width="360" height="74" className="sp-soil" />
                    {Array.from({ length: 24 }, (_, i) => (
                      <path key={i} d={`M${8 + i * 15} 96 l${(i % 3) - 1} -${10 + (i % 4) * 3}`} className="sp-blade" />
                    ))}
                    {[30, 200].map((x) => (
                      <rect key={x} x={x} y="84" width="130" height="16" className="sp-paver" />
                    ))}
                  </>
                )}
                {w.base === 'gravel' && (
                  <>
                    <rect x="0" y="100" width="360" height="70" className="sp-soil" />
                    {Array.from({ length: 70 }, (_, i) => (
                      <circle key={i} cx={(i * 37) % 360} cy={104 + ((i * 13) % 22)} r={2 + (i % 3)} className="sp-stone" />
                    ))}
                    {[10, 125, 240].map((x) => (
                      <rect key={x} x={x} y="84" width="110" height="16" className="sp-paver" />
                    ))}
                  </>
                )}
                {w.base === 'pedestal' && (
                  <>
                    <rect x="0" y="150" width="360" height="20" className="sp-slab" />
                    {[20, 140, 260].map((x) => (
                      <g key={x}>
                        <rect x={x + 30} y="110" width="18" height="40" className="sp-ped" />
                        <rect x={x + 16} y="104" width="46" height="8" className="sp-ped" />
                        <rect x={x + 18} y="144" width="42" height="6" className="sp-ped" />
                      </g>
                    ))}
                    {[0, 118, 238].map((x) => (
                      <rect key={x} x={x + 4} y="88" width="114" height="16" className="sp-paver" />
                    ))}
                  </>
                )}
              </svg>
              <b>{w.name}</b>
              <span>{w.say}</span>
            </li>
          ))}
        </ul>
      </section>
      <Facts
        id="sp-sun"
        title="Built for the weather."
        facts={[
          ['20 mm', 'Thick enough to drive on when laid on a proper base.', '/lines/aperto', 'The Aperto line'],
          ['100 cycles', 'Of freezing and thawing, with no damage.', '/technology/surface-lab', 'The tests'],
          ['Ombra', 'A light-reflecting glaze, cooler underfoot in full sun.', '/technology', 'The technology'],
        ]}
        demo="technology"
      />
    </>
  )
}

/** three facts set large, each with where to see it proved */
function Facts({ id, title, facts, demo = 'tests' }: { id: string; title: string; facts: [string, string, string, string][]; demo?: 'tests' | 'technology' }) {
  return (
    <section className="sh-sec" aria-labelledby={id}>
      <h2 id={id} className="head sp-facts-title" data-rv>
        {title}
      </h2>
      <ul className="sp-facts">
        {facts.map(([n, say, to, label]) => (
          <li key={n} data-rv>
            <b className="num">{n}</b>
            <span>{say}</span>
            <TLink className="u" to={to}>
              {label} →
            </TLink>
          </li>
        ))}
      </ul>
      <DemoNote topic={demo} />
    </section>
  )
}
