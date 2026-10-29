import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { finishById, formatById, formatLabel, LINES, lineById, RANGE, tileUrl, type RangeDesign } from '../data/range'
import { pricePerM2, usd } from '../data/trade'
import { TLink } from '../motion/Transition'
import { personById, ROUTES } from './data'
import { routed } from './state'

// The WhatsApp assistant: an enquiry is answered the moment it arrives, with
// the design, its sizes and its price, or the price list, or the right stone
// for a wet room or a terrace; and the lead goes to the salesperson who
// covers the place it came from. A demo: the answers are worked out here from
// the catalogue; a real one runs on the WhatsApp Business platform.

type Msg = { from: 'them' | 'us'; text?: string; card?: RangeDesign; list?: string[]; link?: { to: string; label: string } }

const PROMPTS = [
  'Price of Calacatta Oro in 1600 × 3200?',
  'Anti-slip tiles for a bathroom, please',
  'Need 400 m² of outdoor tiles for a hotel in Lagos',
  'Do you have wood-look planks? I’m in Jaipur',
  'Kitchen island slab for a villa in Dubai',
]

const words = (d: RangeDesign) => [d.name.toLowerCase(), ...d.name.toLowerCase().split(' ').filter((w) => w.length > 5)]

const fromPrice = (d: RangeDesign) => {
  const l = lineById(d.line)
  return pricePerM2(d, l.hero, l.thicknesses[Math.floor(l.thicknesses.length / 2)], d.finish)
}

/** the reply to an enquiry, worked out from the catalogue */
function answer(text: string): Msg[] {
  const t = text.toLowerCase()
  const design = RANGE.filter((d) => !d.own).find((d) => words(d).some((w) => t.includes(w)))
  const qty = t.match(/(\d[\d,]*)\s*(m2|m²|sqm|sq\.? ?m|square met)/)
  const out: Msg[] = []
  const pick = (line: string, why: string) => {
    const l = lineById(line as never)
    const ds = RANGE.filter((d) => d.line === l.id && !d.own).slice(0, 3)
    out.push({ from: 'us', text: `${why} ${l.name}: ${l.tagline.toLowerCase()} In ${l.formats.map((f) => formatLabel(formatById(f)!)).join(', ')} mm.` })
    ds.forEach((d) => out.push({ from: 'us', card: d }))
  }
  if (design) out.push({ from: 'us', card: design })
  else if (/bath|shower|wet|slip/.test(t)) pick('terme', 'For wet floors, Presa grips like stone when wet (R11) and still looks like satin. Our bath line,')
  else if (/outdoor|terrace|pool|garden|driveway|parking/.test(t)) pick('aperto', 'Outside, you want 20 mm porcelain, laid on grass, gravel or pedestals. Our outdoor line,')
  else if (/kitchen|counter|island|worktop/.test(t)) pick('cucina', 'For counters and islands, full-body slabs in 12 and 20 mm that take a hot pan. Our kitchen line,')
  else if (/wood|plank|oak|walnut|teak/.test(t)) pick('legno', 'Wood that never warps, in porcelain. Our planks,')
  if (/price|rate|cost|list|quote/.test(t) && !design) {
    out.push({ from: 'us', text: 'Our list prices per m², FOB Mundra:' })
    out.push({ from: 'us', list: LINES.map((l) => `${l.name}, ${l.kind.toLowerCase()}: from ${usd(fromPrice(RANGE.find((d) => d.line === l.id)!))}`) })
    out.push({ from: 'us', link: { to: '/downloads', label: 'The full price list, as a PDF' } })
  }
  if (qty) {
    const m2 = Number(qty[1].replace(/,/g, ''))
    out.push({ from: 'us', text: `For ${m2.toLocaleString('en-GB')} m² we add a tenth for cutting and quote in full crates or boxes. A colleague will send the figures in the next hour.` })
  }
  if (!out.length)
    out.push({
      from: 'us',
      text: 'Hello from Orvane Ceramica. Tell me the design, the room or the size you have in mind, and I’ll send the stones, their sizes and prices. Or ask for the price list.',
    })
  out.push({ from: 'us', link: { to: '/quote', label: 'Order a sample box' } })
  return out
}

function routeOf(text: string) {
  const t = text.toLowerCase()
  const r = ROUTES.find((x) => x.words.some((w) => t.includes(w))) ?? ROUTES[ROUTES.length - 1]
  return { to: r.to, why: r.when }
}

export function Assistant() {
  const [log, setLog] = routed.use()
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'us', text: 'Hello from Orvane Ceramica. Ask about a design, a room, a size or a price: I answer at once, any hour.' }])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const pane = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pane.current?.scrollTo({ top: pane.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || typing) return
    setDraft('')
    setMsgs((m) => [...m, { from: 'them', text: t }])
    setTyping(true)
    const r = routeOf(t)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, ...answer(t)])
      setLog([{ at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), text: t, ...r }, ...log].slice(0, 12))
    }, 700)
  }

  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">WhatsApp assistant.</h1>
        <p className="lead">Every enquiry answered the moment it arrives, with the design, the sizes and the price list, and the lead sent to the person who covers that place.</p>
      </header>

      <div className="dl-chat-grid">
        <div className="dl-phone" aria-label="A chat with the Orvane assistant">
          <div className="dl-phone-top">
            <span className="dl-avatar dl-avatar-ink" aria-hidden>
              O
            </span>
            <span>
              <b>Orvane Ceramica</b>
              <span>{typing ? 'typing…' : 'replies instantly'}</span>
            </span>
          </div>
          <div className="dl-chat" ref={pane} data-lenis-prevent aria-live="polite">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div key={i} className={`dl-bubble dl-${m.from}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  {m.text}
                  {m.card && <Card d={m.card} />}
                  {m.list && (
                    <ul>
                      {m.list.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                  {m.link && (
                    <TLink to={m.link.to} className="dl-chat-link">
                      {m.link.label} →
                    </TLink>
                  )}
                </motion.div>
              ))}
              {typing && (
                <motion.div key="typing" className="dl-bubble dl-us dl-dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Typing">
                  <i />
                  <i />
                  <i />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <form
            className="dl-compose"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write as a customer" aria-label="Your message" />
            <button className="btn btn-ink btn-sm" disabled={!draft.trim() || typing}>
              Send
            </button>
          </form>
        </div>

        <div className="dl-chat-side">
          <section className="dl-block" aria-labelledby="dl-try">
            <h2 id="dl-try" className="dl-h2">
              Try an enquiry
            </h2>
            <div className="dl-prompts">
              {PROMPTS.map((p) => (
                <button key={p} onClick={() => send(p)} disabled={typing} data-cursor="hover">
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="dl-block" aria-labelledby="dl-routed">
            <h2 id="dl-routed" className="dl-h2">
              Where the leads went
            </h2>
            {log.length ? (
              <ul className="dl-routed">
                {log.map((r, i) => {
                  const p = personById(r.to)
                  return (
                    <li key={i}>
                      <span className="dl-avatar" style={{ background: p.tint }} aria-hidden>
                        {p.name.slice(0, 1)}
                      </span>
                      <span>
                        <b>
                          {p.name}, {p.role.toLowerCase()}
                        </b>
                        <span>
                          “{r.text}” · {r.why.toLowerCase()} · {r.at}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="muted">Send an enquiry and see who it goes to.</p>
            )}
          </section>

          <section className="dl-block" aria-labelledby="dl-rules">
            <h2 id="dl-rules" className="dl-h2">
              The routing rules
            </h2>
            <ul className="dl-rules">
              {ROUTES.map((r) => {
                const p = personById(r.to)
                return (
                  <li key={r.when}>
                    <span>{r.when}</span>
                    <span>
                      {p.name}, {p.covers}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
          <DemoNote topic="figures" />
        </div>
      </div>
    </div>
  )
}

function Card({ d }: { d: RangeDesign }) {
  const l = lineById(d.line)
  return (
    <span className="dl-card">
      <img src={tileUrl(d.colourways[0].sm)} alt="" width={60} height={120} />
      <span>
        <b>{d.name}</b>
        <span>
          {l.name} · {l.formats.map((f) => formatLabel(formatById(f)!)).join(', ')} mm
        </span>
        <span>
          {l.thicknesses.join(', ')} mm · {l.finishes.map((f) => finishById(f).name).join(', ')}
        </span>
        <b className="num">from {usd(fromPrice(d))} per m², FOB Mundra</b>
        <TLink to={`/collections/${d.id}`} className="dl-chat-link">
          See it →
        </TLink>
      </span>
    </span>
  )
}
