import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { CONTAINERS, PRODUCTS, containerLoad, productById, sizeById, type ContainerId } from '../data/catalog'
import { BRAND, EMAIL, PORTS, WHATSAPP_NUMBER } from '../data/site'
import { num } from '../lib/format'
import { useQuote } from '../lib/quote'
import { ChatIcon, CloseIcon } from './icons'
import './Quote.css'

type Terms = 'FOB Mundra' | 'CIF'

export function Quote() {
  const { items, remove, toggle } = useQuote()
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

  const products = items.map((i) => productById(i)!).filter(Boolean)
  const available = PRODUCTS.filter((p) => !items.includes(p.id))

  // average load across the chosen sizes, for a rough area estimate
  const sqm = useMemo(() => {
    if (!products.length) return 0
    const per = products.reduce((a, p) => a + containerLoad(sizeById(p.size), container).sqm, 0) / products.length
    return per * count
  }, [products, container, count])

  // keyed by role so typing in a field updates its line instead of replacing it
  const lines: [string, string][] = [
    ['hello', `Hello ${BRAND}, I'd like a quote.`],
    ...(products.length
      ? ([
          ['designs', 'Designs:'],
          ...products.map(
            (p) => [p.id, `• ${p.name}, ${sizeById(p.size).label} mm ${p.body} ${p.finish.toLowerCase()}`] as [string, string],
          ),
        ] as [string, string][])
      : []),
    ['qty', `Quantity: ${count} × ${CONTAINERS[container].label} container${count > 1 ? 's' : ''}`],
    ...(port ? [['port', `Port: ${port} (${terms})`] as [string, string]] : []),
    ...(name || company ? [['from', `From: ${[name, company].filter(Boolean).join(', ')}`] as [string, string]] : []),
    ...(notes ? [['notes', `Notes: ${notes}`] as [string, string]] : []),
  ]
  const message = lines.map(([, t]) => t).join('\n')
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent('Container quote request')}&body=${encodeURIComponent(message)}`

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!products.length) next.designs = 'Add at least one design so we know what to price.'
    if (!port.trim()) next.port = 'Enter the port the containers should go to.'
    setErrors(next)
    if (Object.keys(next).length) return
    window.open(waHref, '_blank', 'noopener')
    setSent(true)
  }

  return (
    <section className="quote" id="quote" aria-label="Quote request">
      <div className="wrap quote-grid">

        <form className="quote-form" onSubmit={onSubmit} noValidate>
          <fieldset className="q-field">
            <legend>Designs</legend>
            <ul className="q-designs">
              <AnimatePresence initial={false}>
                {products.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>
                      {p.name} <small>{sizeById(p.size).label}</small>
                    </span>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
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
                if (e.target.value) toggle(e.target.value)
                setErrors((x) => ({ ...x, designs: undefined }))
              }}
              aria-label="Add a design"
              aria-describedby={errors.designs ? `${id}-designs` : undefined}
            >
              <option value="">Add a design…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}, {sizeById(p.size).label} mm {p.finish.toLowerCase()}
                </option>
              ))}
            </select>
            {errors.designs && (
              <p className="q-error" id={`${id}-designs`}>
                {errors.designs}
              </p>
            )}
          </fieldset>

          <div className="q-row">
            <div className="q-field">
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
            <div className="q-field">
              <span className="q-label" id={`${id}-ctype`}>
                Size
              </span>
              <div className="segmented" role="radiogroup" aria-labelledby={`${id}-ctype`}>
                {(Object.keys(CONTAINERS) as ContainerId[]).map((c) => (
                  <button
                    type="button"
                    key={c}
                    role="radio"
                    aria-checked={c === container}
                    onClick={() => setContainer(c)}
                  >
                    {c === container && (
                      <motion.span className="segmented-thumb" layoutId="quote-container-thumb" />
                    )}
                    <span className="segmented-label">{CONTAINERS[c].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="q-row">
            <div className="q-field q-grow">
              <label htmlFor={`${id}-port`}>Destination port</label>
              <input
                id={`${id}-port`}
                className="q-input"
                list={`${id}-ports`}
                placeholder="e.g. Jebel Ali, UAE"
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
            <div className="q-field">
              <span className="q-label" id={`${id}-terms`}>
                Terms
              </span>
              <div className="segmented" role="radiogroup" aria-labelledby={`${id}-terms`}>
                {(['CIF', 'FOB Mundra'] as Terms[]).map((t) => (
                  <button type="button" key={t} role="radio" aria-checked={t === terms} onClick={() => setTerms(t)}>
                    {t === terms && <motion.span className="segmented-thumb" layoutId="quote-terms-thumb" />}
                    <span className="segmented-label">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="q-row">
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

          <div className="q-field">
            <label htmlFor={`${id}-notes`}>
              Notes <span className="q-optional">(optional)</span>
            </label>
            <textarea
              id={`${id}-notes`}
              className="q-input"
              rows={3}
              placeholder="Grade, mixed loads, sample requests"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="q-actions">
            <button type="submit" className="btn btn-whatsapp">
              <ChatIcon />
              Send on WhatsApp
            </button>
            <a className="q-mail" href={mailHref}>
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
          <p className="q-preview-title">Your message</p>
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
          {sqm > 0 && (
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
