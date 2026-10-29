import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { DemoNote } from '../components/Demo'
import { CITIES, DEALER_LEADS, gapOf, IMPORTERS, STAGES, TEAM, type Prospect, type Stage } from './data'
import { stages } from './state'

// New business: the cities where the dealer network is thin (demand for each
// dealer already there), prospective dealers in them, export buyers abroad,
// and the first message to each written for the salesperson. The prospects
// are described, never named: a real list comes from the manufacturer's own
// research. Where each one stands is kept on this device.

const first = (p: Prospect) => {
  if (p.kind === 'dealer') {
    const rep = TEAM.find((t) => t.covers.includes('Maharashtra'))!
    return `Namaste. I’m ${rep.name.split(' ')[0]} from Orvane Ceramica in Morbi. We make porcelain slabs up to 1800 × 3600 mm, and there are very few dealers carrying them in ${p.where.split(',')[0]}. You carry ${p.carries.toLowerCase()}, so our large formats and matched sets would sit beside them without competing. Could we send you a sample box and our dealer terms this week? We give every dealer the showroom visualizer and a marketing kit in their own name.`
  }
  const desk = p.where.match(/Nigeria|Kenya/) ? TEAM.find((t) => t.id === 'chidi')! : p.where.match(/Saudi|UAE/) ? TEAM.find((t) => t.id === 'imran')! : TEAM.find((t) => t.id === 'lucia')!
  return `Hello. ${desk.name.split(' ')[0]} here, from the export desk at Orvane Ceramica, Morbi, India. You import ${p.carries.toLowerCase()} into ${p.where.split(',')[0]}, about ${p.volume}. We ship the same, FOB Mundra, in 20 ft containers loaded to weight, with shade and caliber sorted per batch. May we send our price list and a sample crate?`
}

export function Leads() {
  const [st, setSt] = stages.use()
  const [open, setOpen] = useState<Prospect | null>(null)
  const [copied, setCopied] = useState(false)
  const cities = [...CITIES].sort((a, b) => gapOf(b) - gapOf(a))
  const max = Math.max(...cities.map(gapOf))
  const stageOf = (id: string): Stage => st[id] ?? 'New'
  const all = [...DEALER_LEADS, ...IMPORTERS]
  const count = (s: Stage) => all.filter((p) => stageOf(p.id) === s).length

  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">New dealers and buyers.</h1>
        <p className="lead">Where the network is thin, who could fill it, the buyers abroad who import what you make, and the first message to each.</p>
      </header>

      <dl className="dl-pipe" aria-label="Where the prospects stand">
        {STAGES.map((s) => (
          <div key={s}>
            <dt>{s}</dt>
            <dd className="num">{count(s)}</dd>
          </div>
        ))}
      </dl>

      <section className="dl-block" aria-labelledby="dl-thin">
        <h2 id="dl-thin" className="dl-h2">
          Where the network is thin
        </h2>
        <p className="muted dl-sub">New homes and shops a year for every dealer already there. The longer the bar, the more a new dealer would sell.</p>
        <ol className="in-bars dl-cities">
          {cities.map((c) => (
            <li key={c.city} title={`${c.city}: ${c.demand}k a year, ${c.dealers} ${c.dealers === 1 ? 'dealer' : 'dealers'}`}>
              <span className="in-bars-label">
                {c.city}, <span className="muted">{c.state}</span>
              </span>
              <span className="in-bars-track">
                <i style={{ width: `${(gapOf(c) / max) * 100}%` }} />
                <b className="num">
                  {c.dealers === 0 ? 'no dealer' : `${c.dealers} ${c.dealers === 1 ? 'dealer' : 'dealers'}`} · {c.demand}k a year
                </b>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {(
        [
          ['dl-dealers', 'Prospective dealers in those cities', DEALER_LEADS],
          ['dl-export', 'Export buyers', IMPORTERS],
        ] as const
      ).map(([id, title, list]) => (
        <section key={id} className="dl-block" aria-labelledby={id}>
          <h2 id={id} className="dl-h2">
            {title}
          </h2>
          <ul className="dl-leads">
            {list.map((p) => (
              <li key={p.id}>
                <span className="dl-lead-who">
                  <b>{p.who}</b>
                  <span>{p.where}</span>
                </span>
                <span className="dl-lead-what">
                  <span>{p.carries}</span>
                  <span className="muted">{p.volume ?? p.size}</span>
                </span>
                <select value={stageOf(p.id)} onChange={(e) => setSt({ ...st, [p.id]: e.target.value as Stage })} aria-label={`Where ${p.who}, ${p.where} stands`}>
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button className="btn btn-line btn-sm" onClick={() => setOpen(p)} data-cursor="hover">
                  Write to them
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted dl-sub">Prospects are described, not named: a manufacturer’s own list comes from its research, with the business names and contacts.</p>
      <DemoNote topic="figures" />

      <AnimatePresence>
        {open && (
          <motion.div className="dl-sheet" role="dialog" aria-modal="true" aria-label="The first message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div className="dl-sheet-card" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="title">
                To the {open.who.toLowerCase()}, {open.where.split(',')[0]}
              </h2>
              <p className="dl-message">{first(open)}</p>
              <div className="st-actions">
                <button
                  className="btn btn-ink"
                  onClick={() =>
                    navigator.clipboard?.writeText(first(open)).then(() => {
                      setCopied(true)
                      setSt({ ...st, [open.id]: stageOf(open.id) === 'New' ? 'Contacted' : stageOf(open.id) })
                      setTimeout(() => setCopied(false), 1600)
                    })
                  }
                  data-cursor="hover"
                >
                  {copied ? 'Copied, marked contacted' : 'Copy it'}
                </button>
                <button className="btn btn-line" onClick={() => setOpen(null)} data-cursor="hover">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
