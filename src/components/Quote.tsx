import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { CONTAINERS, containerLoad, type ContainerId, type Size } from '../data/catalog'
import { designById, finishById, formatById, formatLabel, labelOf, LINES, RANGE, specFor } from '../data/range'
import { BRAND, EMAIL, PORTS, WHATSAPP_NUMBER } from '../data/site'
import { num } from '../lib/format'
import { defaultConfig, MAX_SAMPLES, useQuote } from '../lib/quote'
import { ChatIcon, CloseIcon } from './icons'
import './Quote.css'

type Terms = 'FOB Mundra' | 'CIF'
export type Ask = 'samples' | 'price' | 'visit'

const ASKS: { value: Ask; label: string; hello: string }[] = [
  { value: 'samples', label: 'A sample box', hello: 'I’d like a box of samples.' },
  { value: 'price', label: 'A container price', hello: 'I’d like a container quote.' },
  { value: 'visit', label: 'A factory visit', hello: 'I’d like to visit the factory in Morbi.' },
]

export function Quote({ ask: initial = 'samples' }: { ask?: Ask }) {
  const [ask, setAsk] = useState<Ask>(initial)
  const { items, remove, add, full } = useQuote()
  const [count, setCount] = useState(1)
  const [container, setContainer] = useState<ContainerId>('20ft')
  const [port, setPort] = useState('')
  const [terms, setTerms] = useState<Terms>('CIF')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ designs?: string; port?: string }>({})
  const [sent, setSent] = useState(false)
  const id = useId()

  const samples = items.map((s) => {
    const d = designById(s.design)!
    const cw = d.colourways.find((c) => c.slug === s.colourway) ?? d.colourways[0]
    const f = formatById(s.format)!
    return { s, d, cw, f, label: `${formatLabel(f)} mm · ${s.thickness} mm · ${finishById(s.finish).name}` }
  })
  const available = RANGE.filter((d) => !items.some((s) => s.design === d.id))

  // average load across the chosen samples, for a rough area estimate
  const sqm = useMemo(() => {
    if (!samples.length) return 0
    const per =
      samples.reduce((a, { s, d }) => {
        const p = specFor(d, s.format, s.thickness, s.finish).packing
        // boxes ride about a tonne to a pallet; slab crates are their own pallet
        const unit: Size = {
          ...(formatById(s.format) as unknown as Size),
          boxesPerPallet: p.unit === 'crate' ? 1 : Math.max(1, Math.floor(1000 / p.kg)),
          kgPerBox: p.kg,
          sqmPerBox: p.m2,
        }
        return a + containerLoad(unit, container).sqm
      }, 0) / samples.length
    return per * count
  }, [samples, container, count])

  // keyed by role so typing in a field updates its line instead of replacing it
  const lines: [string, string][] = [
    ['hello', `Hello ${BRAND}, ${ASKS.find((a) => a.value === ask)!.hello}`],
    ...(samples.length
      ? ([
          ['designs', 'Designs:'],
          ...samples.map(
            ({ s, d, cw, f }) =>
              [s.key, `• ${labelOf(d, cw.slug)}, ${formatLabel(f)} mm, ${s.thickness} mm, ${finishById(s.finish).name.toLowerCase()}`] as [string, string],
          ),
        ] as [string, string][])
      : []),
    ...(ask === 'price'
      ? [['qty', `Quantity: ${count} × ${CONTAINERS[container].label} container${count > 1 ? 's' : ''}`] as [string, string]]
      : []),
    ...(port
      ? [
          [
            'port',
            ask === 'price' ? `Port: ${port} (${terms})` : ask === 'samples' ? `Send to: ${port}` : `Travelling from: ${port}`,
          ] as [string, string],
        ]
      : []),
    ...(name || company ? [['from', `From: ${[name, company].filter(Boolean).join(', ')}`] as [string, string]] : []),
    ...(notes ? [['notes', `Notes: ${notes}`] as [string, string]] : []),
  ]
  const message = lines.map(([, t]) => t).join('\n')
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent('Container quote request')}&body=${encodeURIComponent(message)}`

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!samples.length && ask !== 'visit') next.designs = 'Add at least one design.'
    if (!port.trim())
      next.port =
        ask === 'price'
          ? 'Enter the port the containers should go to.'
          : ask === 'samples'
            ? 'Enter the city and country to send the samples to.'
            : 'Enter where you would travel from.'
    setErrors(next)
    if (Object.keys(next).length) return
    window.open(waHref, '_blank', 'noopener')
    setSent(true)
  }

  return (
    <section className="quote" id="quote" aria-label="Quote request">
      <div className="quote-grid">

        <form className="quote-form" onSubmit={onSubmit} noValidate>
          <div className="q-field" data-rv>
            <span className="visually-hidden" id={`${id}-ask`}>
              What would you like?
            </span>
            <div className="seg q-ask" role="radiogroup" aria-labelledby={`${id}-ask`}>
              {ASKS.map((a) => (
                <button type="button" key={a.value} role="radio" aria-checked={a.value === ask} onClick={() => setAsk(a.value)}>
                  {a.value === ask && (
                    <motion.span className="seg-thumb" layoutId="quote-ask-thumb" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                  )}
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <fieldset className="q-field" data-rv>
            <legend>Designs</legend>
            <ul className="q-designs">
              <AnimatePresence initial={false}>
                {samples.map(({ s, d, cw, label }) => (
                  <motion.li
                    key={s.key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img src={`/renders/range/${d.id}--${cw.slug}.jpg`} alt="" width={720} height={960} />
                    <span>
                      {labelOf(d, cw.slug)} <small className="mono">{label}</small>
                    </span>
                    <button type="button" onClick={() => remove(s.key)} aria-label={`Remove ${labelOf(d, cw.slug)}`}>
                      <CloseIcon />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <select
              className="q-input"
              value=""
              onChange={(e) => {
                const d = designById(e.target.value)
                if (d) add(defaultConfig(d))
                setErrors((x) => ({ ...x, designs: undefined }))
              }}
              disabled={full}
              aria-label="Add a design"
              aria-describedby={errors.designs ? `${id}-designs` : undefined}
            >
              <option value="">{full ? `The box holds ${MAX_SAMPLES} samples` : 'Add a design…'}</option>
              {LINES.map((l) => (
                <optgroup key={l.id} label={`${l.name}: ${l.kind}`}>
                  {available
                    .filter((d) => d.line === l.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {errors.designs && (
              <p className="q-error" id={`${id}-designs`}>
                {errors.designs}
              </p>
            )}
          </fieldset>

          {ask === 'price' && (
          <div className="q-row" data-rv>
            <div className="q-field" data-rv>
              <label htmlFor={`${id}-count`}>Containers</label>
              <div className="stepper">
                <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="One fewer">
                  −
                </button>
                <input
                  id={`${id}-count`}
                  className="num"
                  inputMode="numeric"
                  value={count}
                  onChange={(e) => setCount(Math.min(99, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))}
                />
                <button type="button" onClick={() => setCount((c) => Math.min(99, c + 1))} aria-label="One more">
                  +
                </button>
              </div>
            </div>
            <div className="q-field" data-rv>
              <span className="q-label" id={`${id}-ctype`}>
                Size
              </span>
              <div className="seg" role="radiogroup" aria-labelledby={`${id}-ctype`}>
                {(Object.keys(CONTAINERS) as ContainerId[]).map((c) => (
                  <button
                    type="button"
                    key={c}
                    role="radio"
                    aria-checked={c === container}
                    onClick={() => setContainer(c)}
                  >
                    {c === container && (
                      <motion.span className="seg-thumb" layoutId="quote-container-thumb" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                    )}
                    <span>{CONTAINERS[c].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          <div className="q-row" data-rv>
            <div className="q-field q-grow">
              <label htmlFor={`${id}-port`}>
                {ask === 'price' ? 'Destination port' : ask === 'samples' ? 'Send samples to' : 'Travelling from'}
              </label>
              <input
                id={`${id}-port`}
                className="q-input"
                list={`${id}-ports`}
                placeholder={ask === 'price' ? 'e.g. Jebel Ali, UAE' : 'City and country'}
                value={port}
                onChange={(e) => {
                  setPort(e.target.value)
                  setErrors((x) => ({ ...x, port: undefined }))
                }}
                aria-invalid={!!errors.port}
                aria-describedby={errors.port ? `${id}-port-err` : undefined}
              />
              <datalist id={`${id}-ports`}>
                {PORTS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {errors.port && (
                <p className="q-error" id={`${id}-port-err`}>
                  {errors.port}
                </p>
              )}
            </div>
            {ask === 'price' && (
            <div className="q-field" data-rv>
              <span className="q-label" id={`${id}-terms`}>
                Terms
              </span>
              <div className="seg" role="radiogroup" aria-labelledby={`${id}-terms`}>
                {(['CIF', 'FOB Mundra'] as Terms[]).map((t) => (
                  <button type="button" key={t} role="radio" aria-checked={t === terms} onClick={() => setTerms(t)}>
                    {t === terms && (
                      <motion.span className="seg-thumb" layoutId="quote-terms-thumb" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                    )}
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>

          <div className="q-row" data-rv>
            <div className="q-field q-grow">
              <label htmlFor={`${id}-name`}>Your name</label>
              <input
                id={`${id}-name`}
                className="q-input"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="q-field q-grow">
              <label htmlFor={`${id}-company`}>Company</label>
              <input
                id={`${id}-company`}
                className="q-input"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="q-field" data-rv>
            <label htmlFor={`${id}-notes`}>
              Notes <span className="q-optional">(optional)</span>
            </label>
            <textarea
              id={`${id}-notes`}
              className="q-input"
              rows={3}
              placeholder={ask === 'visit' ? 'The dates that suit you' : 'Grade, mixed loads, anything else'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="q-actions">
            <button type="submit" className="btn btn-ink" data-cursor="hover">
              <ChatIcon />
              Send on WhatsApp
            </button>
            <a className="u q-mail" href={mailHref}>
              Email it instead
            </a>
          </div>
          <AnimatePresence>
            {sent && (
              <motion.p
                className="q-sent"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                WhatsApp opened in a new tab with your message. If it didn’t, use “Email it instead”.
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        <aside className="q-preview" aria-label="Message preview">
          {ask !== 'visit' && samples.length > 0 && (
            <motion.ul className="q-box" layout aria-label="In your sample box">
              <AnimatePresence initial={false}>
                {samples.map(({ s, d, cw }) => (
                  <motion.li
                    key={s.key}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  >
                    <img src={`/renders/range/${d.id}--${cw.slug}.jpg`} alt={labelOf(d, cw.slug)} width={720} height={960} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
          <div className="q-chat">
          <p className="q-chat-head mono">
            <span>To {BRAND}, Morbi</span>
            <span>Your message</span>
          </p>
          <motion.div className="bubble" layout transition={{ type: 'spring', stiffness: 400, damping: 36 }}>
            <AnimatePresence initial={false} mode="popLayout">
              {lines.map(([k, l]) => (
                <motion.p
                  key={k}
                  layout="position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {l}
                </motion.p>
              ))}
            </AnimatePresence>
          </motion.div>
          <p className="q-chat-foot mono">Written as you type · opens in WhatsApp</p>
          </div>
          {ask === 'price' && sqm > 0 && (
            <p className="q-estimate">
              Roughly <strong className="num">{num(sqm)} m²</strong> across {count} × {CONTAINERS[container].label},
              based on typical packing for these sizes.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
