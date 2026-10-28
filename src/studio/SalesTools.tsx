import { motion } from 'motion/react'
import qrcode from 'qrcode-generator'
import { useEffect, useMemo } from 'react'
import { DemoNote } from '../components/Demo'
import { TLink } from '../motion/Transition'
import { designById } from '../data/range'
import { moqOf, packs, pricePerM2, stockOf, usd } from '../data/trade'
import { linesOf, printProject, projectLink, useDealer, useProject } from './project'
import { sampleOf, type Kind, type Lay } from './state'

// The Studio's sales tools: the project a visitor builds room by room, the
// dealer's view of it (prices, stock, lead times, a quotation with their name
// on it), a showroom mode for a big screen, and a code that hands the room to
// the client's phone.

/** the trade facts under the stone card, in dealer mode */
export function TradeLine({ lay, kind }: { lay: Lay; kind: Kind }) {
  const [dealer] = useDealer()
  const d = designById(lay.design)!
  if (!dealer.on || d.own) return null
  const mm = sampleOf(lay, kind).thickness
  return (
    <p className="st-trade">
      <b className="num">{usd(pricePerM2(d, lay.format, mm, lay.finish))}</b> per m² FOB Mundra · {stockOf(d.id).label} · minimum {moqOf(lay.format)}
    </p>
  )
}

/** the project, room by room and added up, with the schedule to print and send */
export function ProjectDrawer({ onClose }: { onClose: () => void }) {
  const { items, remove, clear } = useProject()
  const [dealer] = useDealer()
  const p = useMemo(() => linesOf(items), [items])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  const rooms = [...new Set(items.map((i) => `${i.house}, ${i.room.toLowerCase()}`))]
  return (
    <motion.aside
      className="st-drawer st-project"
      aria-label="Your project"
      initial={{ x: '104%' }}
      animate={{ x: 0 }}
      exit={{ x: '104%' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      data-lenis-prevent
    >
      <header className="st-drawer-head">
        <div>
          <h2 className="st-drawer-title">{dealer.on && dealer.client ? `For ${dealer.client}` : 'Your project'}</h2>
          <p>{items.length ? `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'}, ${p.lines.length} ${p.lines.length === 1 ? 'stone' : 'stones'}` : 'Add a room to start'}</p>
        </div>
        <button className="st-close" onClick={onClose} aria-label="Close" data-cursor="hover">
          ×
        </button>
      </header>
      <div className="st-project-body">
        {items.length === 0 ? (
          <p className="st-project-empty">Lay a room, then press “Add room to project”. Every surface goes in, with its area and what to order for it.</p>
        ) : (
          <>
            <ul className="st-project-lines">
              {p.lines.map((l) => (
                <li key={l.label + l.format + l.finish + l.thickness}>
                  <b>{l.label}</b>
                  <span className="st-stone-meta">
                    {l.format} · {l.thickness} mm · {l.finish}
                  </span>
                  <span>{l.where.join('; ')}</span>
                  <span className="num">
                    {l.area.toFixed(1)} m² · {l.pieces} pieces in {packs(l.packs, l.unit)} · {(l.kg / 1000).toFixed(1)} t
                  </span>
                  {dealer.on && (
                    <span className="num st-project-price">
                      {usd(l.price)}/m² · {usd(l.total)} · {l.stock}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <dl className="st-project-total">
              <div>
                <dt>Area</dt>
                <dd className="num">{p.area.toFixed(1)} m²</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd className="num">{(p.kg / 1000).toFixed(1)} t</dd>
              </div>
              <div>
                <dt>20 ft containers</dt>
                <dd className="num">{p.containers}</dd>
              </div>
              {dealer.on && (
                <div>
                  <dt>FOB Mundra</dt>
                  <dd className="num">{usd(p.total)}</dd>
                </div>
              )}
            </dl>
            <div className="st-chips st-project-rooms" aria-label="Rooms in the project">
              {[...new Set(items.map((i) => i.key.split(':')[0]))].map((r) => {
                const first = items.find((i) => i.key.startsWith(`${r}:`))!
                return (
                  <button key={r} onClick={() => items.filter((i) => i.key.startsWith(`${r}:`)).forEach((i) => remove(i.key))} title="Take this room out">
                    {first.room} ×
                  </button>
                )
              })}
            </div>
            <div className="st-actions">
              <button className="btn btn-ink btn-sm" onClick={() => printProject(items, dealer)} data-cursor="hover">
                {dealer.on ? 'Print the quotation' : 'Print the schedule'}
              </button>
              <a className="btn btn-line btn-sm" href={projectLink(items)} target="_blank" rel="noopener" data-cursor="hover">
                Send on WhatsApp
              </a>
              <button className="btn btn-line btn-sm" onClick={clear} data-cursor="hover">
                Start again
              </button>
            </div>
            <DemoNote topic="figures" />
          </>
        )}
      </div>
    </motion.aside>
  )
}

/** the dealer's settings: their showroom, their client, the showroom screen */
export function DealerPanel({ onPresent, onClose }: { onPresent: () => void; onClose: () => void }) {
  const [dealer, setDealer] = useDealer()
  return (
    <motion.div className="st-dealer" role="dialog" aria-label="Dealer mode" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <header className="st-drawer-head">
        <div>
          <h2 className="st-drawer-title">Dealer mode</h2>
          <p>Trade prices, stock and lead times, and quotations in your name.</p>
        </div>
        <button className="st-close" onClick={onClose} aria-label="Close" data-cursor="hover">
          ×
        </button>
      </header>
      <label className="st-field">
        <span>Your showroom</span>
        <input value={dealer.showroom} onChange={(e) => setDealer({ ...dealer, showroom: e.target.value })} placeholder="Showroom name, city" maxLength={60} />
      </label>
      <label className="st-field">
        <span>Your client</span>
        <input value={dealer.client} onChange={(e) => setDealer({ ...dealer, client: e.target.value })} placeholder="Client or project" maxLength={60} />
      </label>
      <div className="st-actions">
        <button className="btn btn-ink btn-sm" aria-pressed={dealer.on} onClick={() => setDealer({ ...dealer, on: !dealer.on })} data-cursor="hover">
          {dealer.on ? 'Turn dealer mode off' : 'Turn dealer mode on'}
        </button>
        <button className="btn btn-line btn-sm" onClick={onPresent} data-cursor="hover">
          Showroom screen
        </button>
      </div>
      <TLink className="u st-insights-link" to="/studio/insights" data-cursor="hover">
        What visitors lay: the insights →
      </TLink>
      <DemoNote topic="figures" />
    </motion.div>
  )
}

/** a QR code of the room's link, for the client to take the room home on their phone */
export function TakeHome({ onClose }: { onClose: () => void }) {
  const url = window.location.href
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(url)
    qr.make()
    const count = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
    return { n: count, path: d }
  }, [url])
  return (
    <motion.div className="st-qr" role="dialog" aria-label="Take this room home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label="A code that opens this room on a phone" shapeRendering="crispEdges">
          <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
          <path d={path} fill="#0b0b0c" />
        </svg>
        <figcaption>
          <b>Take this room home.</b>
          <span>Scan with a phone’s camera: the room opens there exactly as it is laid here.</span>
        </figcaption>
        <button className="btn btn-ink btn-sm" onClick={onClose} data-cursor="hover">
          Done
        </button>
      </figure>
    </motion.div>
  )
}
