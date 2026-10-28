import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { designById, finishById, tileUrl, type FinishId } from '../data/range'
import { TLink } from '../motion/Transition'
import { clearInsights, readInsights } from '../studio/insights'
import { ROOMS } from '../studio/rooms'
import './studio.css'

// Insights: what visitors do in the Studio. Which stones they lay, in which
// rooms, at what hour they settle the light, which finishes they pick, and
// how far they go, from opening a room to asking for a quote. A sample month
// stands beside this device's own counts; a manufacturer's site would feed
// its analytics here instead. One source is shown at a time, so each chart is
// a single series in one ink.

type Source = 'month' | 'device'

/** SAMPLE DATA: a plausible month of Studio visits for a demo company */
const MONTH = {
  visits: 4180,
  rooms: { living: 2960, kitchen: 1840, bath: 1610, bedroom: 920, lobby: 760, pool: 690, custom: 540 } as Record<string, number>,
  lays: { calacatta: 812, nero: 640, statuario: 598, miele: 455, 'trav-oro': 402, portoro: 377, rovere: 341, azzurro: 298, armani: 251, taupe: 233 } as Record<string, number>,
  finishes: { glossy: 1840, specchio: 1310, satin: 1080, matt: 820, presa: 360, grip: 240, carving: 180, pelle: 120 } as Record<string, number>,
  hours: [12, 6, 3, 2, 2, 4, 9, 22, 48, 71, 88, 104, 131, 126, 98, 84, 92, 118, 156, 188, 201, 172, 104, 41],
  funnel: { rooms: 4180, laid: 3120, photo: 940, share: 610, sample: 388, project: 214, enquiry: 96 } as Record<string, number>,
}

const STEPS: [string, string][] = [
  ['rooms', 'Opened a room'],
  ['laid', 'Laid a stone'],
  ['photo', 'Took a photograph'],
  ['share', 'Shared the room'],
  ['sample', 'Asked for a sample'],
  ['project', 'Built a project'],
  ['enquiry', 'Sent an enquiry'],
]

const sum = (o: Record<string, number> = {}) => Object.values(o).reduce((a, b) => a + b, 0)
const fmt = (n: number) => n.toLocaleString('en-GB')

function fromDevice() {
  const c = readInsights()
  const hours = Array.from({ length: 24 }, (_, h) => c.hour?.[String(h)] ?? 0)
  return {
    visits: sum(c.room) + (c.present?.all ?? 0),
    rooms: c.room ?? {},
    lays: c.lay ?? {},
    finishes: c.finish ?? {},
    hours,
    funnel: {
      rooms: sum(c.room),
      laid: sum(c.lay),
      photo: sum(c.photo),
      share: sum(c.share),
      sample: sum(c.sample),
      project: sum(c.project),
      enquiry: 0,
    } as Record<string, number>,
  }
}

export default function InsightsPage() {
  const [source, setSource] = useState<Source>('month')
  const [version, setVersion] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => (source === 'month' ? MONTH : fromDevice()), [source, version])
  const empty = source === 'device' && data.visits === 0 && sum(data.lays) === 0

  const stones = Object.entries(data.lays)
    .filter(([id]) => designById(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const rooms = Object.entries(data.rooms)
    .map(([id, n]) => [id === 'custom' ? 'Your room' : (ROOMS.find((r) => r.id === id)?.name ?? id), n] as [string, number])
    .sort((a, b) => b[1] - a[1])
  const finishes = Object.entries(data.finishes)
    .map(([id, n]) => [finishById(id as FinishId)?.name ?? id, n] as [string, number])
    .sort((a, b) => b[1] - a[1])
  const funnel = STEPS.map(([k, label]) => [label, data.funnel[k] ?? 0] as [string, number])
  const peak = data.hours.indexOf(Math.max(...data.hours))

  return (
    <div className="st in">
      <header className="ph-head">
        <h1 className="ph-title">Insights.</h1>
        <p className="lead">
          What visitors do in the Studio: the stones they lay, the rooms and the hours they choose, and how far they go.
        </p>
      </header>

      <div className="in-bar">
        <div className="seg" role="radiogroup" aria-label="Figures">
          {(
            [
              ['month', 'A sample month'],
              ['device', 'This device'],
            ] as const
          ).map(([id, name]) => (
            <button key={id} role="radio" aria-checked={source === id} onClick={() => setSource(id)} data-cursor="hover">
              {source === id && <motion.span className="seg-thumb" layoutId="in-seg" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
              <span>{name}</span>
            </button>
          ))}
        </div>
        {source === 'device' && !empty && (
          <button
            className="btn btn-line btn-sm"
            onClick={() => {
              clearInsights()
              setVersion((v) => v + 1)
            }}
            data-cursor="hover"
          >
            Clear this device’s counts
          </button>
        )}
        <DemoNote topic="figures" />
      </div>

      {empty ? (
        <section className="sh-sec in-empty">
          <h2 className="title">Nothing counted on this device yet.</h2>
          <p>Open the Studio, lay a few stones, take a photograph: every step is counted here, and only here.</p>
          <TLink className="btn btn-ink btn-arrow" to="/studio" data-cursor="hover">
            Open the Studio
          </TLink>
        </section>
      ) : (
        <div className="in-grid">
          <section className="in-card in-hero" aria-labelledby="in-visits">
            <h2 id="in-visits" className="in-label">
              Studio visits
            </h2>
            <p className="in-figure num">{fmt(data.visits)}</p>
            <dl className="in-tiles">
              <div>
                <dt>Stones laid</dt>
                <dd className="num">{fmt(data.funnel.laid)}</dd>
              </div>
              <div>
                <dt>Photographs</dt>
                <dd className="num">{fmt(data.funnel.photo)}</dd>
              </div>
              <div>
                <dt>Samples asked for</dt>
                <dd className="num">{fmt(data.funnel.sample)}</dd>
              </div>
            </dl>
          </section>

          <section className="in-card" aria-labelledby="in-stones">
            <h2 id="in-stones" className="in-label">
              The stones laid most
            </h2>
            <Bars
              rows={stones.map(([id, n]) => {
                const d = designById(id)!
                return { key: id, label: d.name, value: n, thumb: tileUrl(d.colourways[0].sm) }
              })}
            />
          </section>

          <section className="in-card" aria-labelledby="in-funnel">
            <h2 id="in-funnel" className="in-label">
              How far visitors go
            </h2>
            <Bars rows={funnel.map(([label, n], i) => ({ key: label, label, value: n, note: i ? share(n, funnel[i - 1][1]) : undefined }))} />
          </section>

          <section className="in-card" aria-labelledby="in-rooms">
            <h2 id="in-rooms" className="in-label">
              Rooms opened
            </h2>
            <Bars rows={rooms.map(([label, n]) => ({ key: label, label, value: n }))} />
          </section>

          <section className="in-card" aria-labelledby="in-finish">
            <h2 id="in-finish" className="in-label">
              Finishes chosen
            </h2>
            <Bars rows={finishes.map(([label, n]) => ({ key: label, label, value: n }))} />
          </section>

          <section className="in-card in-wide" aria-labelledby="in-hours">
            <h2 id="in-hours" className="in-label">
              The hour visitors set the light to
            </h2>
            <Hours hours={data.hours} peak={peak} />
          </section>
        </div>
      )}
    </div>
  )
}

const share = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}% of the step before` : undefined)

/** a sorted bar list: the label, a bar from one baseline, the value at its tip */
function Bars({ rows }: { rows: { key: string; label: string; value: number; thumb?: string; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="in-none">None yet.</p>
  return (
    <ol className="in-bars">
      {rows.map((r) => (
        <li key={r.key} title={r.note ? `${r.label}: ${fmt(r.value)}, ${r.note}` : `${r.label}: ${fmt(r.value)}`}>
          <span className="in-bars-label">
            {r.thumb && <img src={r.thumb} alt="" width={20} height={40} />}
            {r.label}
          </span>
          <span className="in-bars-track">
            <i style={{ width: `${(r.value / max) * 100}%` }} />
            <b className="num">{fmt(r.value)}</b>
          </span>
          {r.note && <span className="in-bars-note">{r.note}</span>}
        </li>
      ))}
    </ol>
  )
}

/** twenty-four columns, the peak labelled, each hour's figure on hover and in the table */
function Hours({ hours, peak }: { hours: number[]; peak: number }) {
  const max = Math.max(1, ...hours)
  const [at, setAt] = useState<number | null>(null)
  return (
    <figure className="in-hours">
      <div className="in-cols" onPointerLeave={() => setAt(null)}>
        {hours.map((n, h) => (
          <span key={h} className="in-col" onPointerEnter={() => setAt(h)} data-on={at === h ? '' : undefined}>
            <i style={{ height: `${(n / max) * 100}%` }} data-peak={h === peak && n > 0 ? '' : undefined} />
            {(at === h || (at === null && h === peak && n > 0)) && (
              <b className="in-tip num">
                {String(h).padStart(2, '0')}:00 · {fmt(n)}
              </b>
            )}
          </span>
        ))}
      </div>
      <div className="in-axis" aria-hidden>
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h} style={{ left: `${((h + 0.5) / 24) * 100}%` }}>
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>
      <table className="visually-hidden">
        <caption>Visitors by the hour they set the light to</caption>
        <tbody>
          {hours.map((n, h) => (
            <tr key={h}>
              <th scope="row">{String(h).padStart(2, '0')}:00</th>
              <td>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
