import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { designById, formatById, formatLabel, labelOf, lineById, LINES, tileUrl, type LineId, type RangeDesign } from '../data/range'
import { packs as packsOf, usd } from '../data/trade'
import { batchesOf, lineFigures, ORDER_STEPS, PAST_ORDERS, shadeColour, STOCKED, type Batch, type Order, type OrderLine } from './data'
import { cart, placed } from './state'

// Stock and orders. Every design, its batches with their shade and caliber,
// what is free at Morbi and at the dealer's depot; an order put together on
// a phone and sent, all from one batch so a floor matches; and the orders on
// their way, step by step. Nobody has to call anybody.

const fmtM2 = (n: number) => `${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })} m²`

export function Stock() {
  const [q, setQ] = useState('')
  const [line, setLine] = useState<LineId | 'all'>('all')
  const [onlyStock, setOnlyStock] = useState(true)
  const [all, setAll] = useState(false)
  const [items, setItems] = cart.use()
  const [mine, setMine] = placed.use()
  const [review, setReview] = useState(false)
  const [sent, setSent] = useState<Order | null>(null)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return STOCKED.filter((d) => (line === 'all' || d.line === line) && (!t || d.name.toLowerCase().includes(t) || lineById(d.line).name.toLowerCase().includes(t))).filter(
      (d) => !onlyStock || batchesOf(d, lineById(d.line).hero).some((b) => b.morbi > 0),
    )
  }, [q, line, onlyStock])

  const shown = all ? list : list.slice(0, 10)
  const orders = [...mine, ...PAST_ORDERS]
  const totals = items.reduce(
    (a, l) => {
      const f = lineFigures(l)
      return { m2: a.m2 + f.m2, kg: a.kg + f.kg, value: a.value + f.m2 * f.price }
    },
    { m2: 0, kg: 0, value: 0 },
  )

  const send = () => {
    const no = `ORV-26-${String(4800 + mine.length + 1).padStart(5, '0')}`
    const now = new Date()
    const eta = new Date(now.getTime() + 6 * 864e5)
    const o: Order = {
      no,
      placed: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      state: 'Placed',
      eta: `Due ${eta.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      lines: items,
    }
    setMine([o, ...mine])
    setItems([])
    setReview(false)
    setSent(o)
  }

  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">Stock and orders.</h1>
        <p className="lead">Every design by batch and shade, free to order now. Order from one batch and the floor matches.</p>
      </header>

      <div className="dl-tools">
        <input className="dl-search" type="search" placeholder="Find a design or a line" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a design" />
        <div className="st-chips" role="radiogroup" aria-label="Line">
          {[{ id: 'all' as const, name: 'All' }, ...LINES].map((l) => (
            <button key={l.id} role="radio" aria-checked={l.id === line} onClick={() => setLine(l.id)}>
              {l.name}
            </button>
          ))}
        </div>
        <label className="dl-check">
          <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
          In stock only
        </label>
      </div>

      <ul className="dl-stock">
        {shown.map((d) => (
          <StockRow key={d.id} d={d} onAdd={(l) => setItems([...cart.get().filter((x) => !(x.design === l.design && x.format === l.format && x.batch === l.batch)), l])} />
        ))}
      </ul>
      {list.length > 10 && (
        <button className="btn btn-line btn-sm dl-all" onClick={() => setAll((a) => !a)} data-cursor="hover">
          {all ? 'Show fewer' : `Show all ${list.length} designs`}
        </button>
      )}

      {items.length > 0 && (
        <div className="dl-cartbar">
          <span>
            <b>
              {items.length} {items.length === 1 ? 'line' : 'lines'}
            </b>{' '}
            · {fmtM2(totals.m2)} · {(totals.kg / 1000).toFixed(1)} t · {usd(totals.value)}
          </span>
          <button className="btn btn-ink btn-sm" onClick={() => setReview(true)} data-cursor="hover">
            Review the order
          </button>
        </div>
      )}

      <section className="dl-orders" aria-labelledby="dl-orders-title">
        <h2 id="dl-orders-title" className="dl-h2">
          Your orders
        </h2>
        <ul>
          {orders.map((o) => (
            <li key={o.no} className="dl-order">
              <div className="dl-order-head">
                <b className="num">{o.no}</b>
                <span className="muted">Placed {o.placed}</span>
                <span className="dl-order-eta">{o.eta}</span>
              </div>
              <ol className="dl-steps" aria-label={`${o.no}: ${o.state}`}>
                {ORDER_STEPS.map((s, i) => (
                  <li key={s} data-done={i <= ORDER_STEPS.indexOf(o.state) ? '' : undefined}>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="dl-order-lines">
                {o.lines
                  .map((l) => {
                    const f = lineFigures(l)
                    return `${labelOf(designById(l.design)!, l.colourway)}, ${formatLabel(formatById(l.format)!)}, ${packsOf(l.packs, f.unit)} from ${l.batch} (S${l.shade})`
                  })
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <DemoNote topic="figures" />

      <AnimatePresence>
        {review && (
          <motion.div className="dl-sheet" role="dialog" aria-modal="true" aria-label="Your order" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReview(false)}>
            <motion.div className="dl-sheet-card" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} data-lenis-prevent>
              <h2 className="title">Your order</h2>
              <ul className="dl-review">
                {items.map((l) => {
                  const f = lineFigures(l)
                  const d = designById(l.design)!
                  return (
                    <li key={l.design + l.format + l.batch}>
                      <img src={tileUrl(d.colourways[0].sm)} alt="" width={36} height={72} />
                      <span>
                        <b>{labelOf(d, l.colourway)}</b>
                        <span>
                          {formatLabel(formatById(l.format)!)} mm · {l.thickness} mm · batch {l.batch}, shade S{l.shade}
                        </span>
                        <span className="num">
                          {packsOf(l.packs, f.unit)} · {fmtM2(f.m2)} · {(f.kg / 1000).toFixed(2)} t · {usd(f.m2 * f.price)}
                        </span>
                      </span>
                      <button className="dl-x" onClick={() => setItems(items.filter((x) => x !== l))} aria-label="Remove">
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="dl-review-total num">
                {fmtM2(totals.m2)} · {(totals.kg / 1000).toFixed(1)} t · <b>{usd(totals.value)}</b> at your price, delivered to your depot
              </p>
              <div className="st-actions">
                <button className="btn btn-ink" onClick={send} disabled={!items.length} data-cursor="hover">
                  Place the order
                </button>
                <button className="btn btn-line" onClick={() => setReview(false)} data-cursor="hover">
                  Keep adding
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {sent && (
          <motion.div className="dl-sheet" role="dialog" aria-modal="true" aria-label="Order placed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSent(null)}>
            <motion.div className="dl-sheet-card dl-sent" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="title">Order {sent.no} is in.</h2>
              <p>
                Morbi has it now, the batches are held for you, and it is {sent.eta.toLowerCase()}. You will see each step here, and on WhatsApp.
              </p>
              <button className="btn btn-ink" onClick={() => setSent(null)} data-cursor="hover">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StockRow({ d, onAdd }: { d: RangeDesign; onAdd: (l: OrderLine) => void }) {
  const L = lineById(d.line)
  const [format, setFormat] = useState(L.hero)
  const batches = useMemo(() => batchesOf(d, format), [d, format])
  const [bi, setBi] = useState(() => Math.max(0, batches.findIndex((b) => b.morbi > 0)))
  const [n, setN] = useState(1)
  const [added, setAdded] = useState(false)
  const b: Batch | undefined = batches[bi] ?? batches[0]
  const thickness = L.thicknesses[Math.floor(L.thicknesses.length / 2)]
  const line: OrderLine = { design: d.id, colourway: d.colourways[0].slug, format, thickness, finish: d.finish, batch: b.code, shade: b.shade, packs: n }
  const f = lineFigures(line)
  const free = b.morbi + b.depot
  const maxPacks = Math.max(0, Math.floor(free / (f.m2 / n)))

  return (
    <li className="dl-row">
      <img src={tileUrl(d.colourways[0].sm)} alt="" width={48} height={96} loading="lazy" />
      <div className="dl-row-name">
        <b>{d.name}</b>
        <span>
          {L.name} ·{' '}
          <select value={format} onChange={(e) => setFormat(e.target.value)} aria-label={`${d.name} size`}>
            {L.formats.map((x) => (
              <option key={x} value={x}>
                {formatLabel(formatById(x)!)}
              </option>
            ))}
          </select>
        </span>
      </div>
      <div className="dl-batches" role="radiogroup" aria-label={`${d.name} batches`}>
        {batches.map((x, i) => (
          <button key={x.code} role="radio" aria-checked={i === bi} disabled={x.morbi + x.depot === 0} onClick={() => setBi(i)}>
            <i style={{ background: shadeColour(d.colourways[0].swatch, x.shade) }} aria-hidden />
            <span>
              <b className="num">{x.code}</b>
              <span>
                S{x.shade} · {x.caliber} · {x.made}
              </span>
              <span className="num">
                {x.morbi + x.depot ? fmtM2(x.morbi) : 'Sold out'}
                {x.depot ? ` + ${fmtM2(x.depot)} at your depot` : ''}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="dl-buy">
        <div className="dl-stepper">
          <button onClick={() => setN(Math.max(1, n - 1))} aria-label="Fewer">
            −
          </button>
          <span className="num" aria-live="polite">
            {packsOf(n, f.unit)}
          </span>
          <button onClick={() => setN(Math.min(Math.max(1, maxPacks), n + 1))} aria-label="More">
            +
          </button>
        </div>
        <span className="num dl-buy-fig">
          {fmtM2(f.m2)} · {usd(f.price)}/m²
        </span>
        <button
          className="btn btn-ink btn-sm"
          disabled={!free}
          onClick={() => {
            onAdd(line)
            setAdded(true)
            setTimeout(() => setAdded(false), 1400)
          }}
          data-cursor="hover"
        >
          {added ? 'Added' : 'Add'}
        </button>
      </div>
    </li>
  )
}
