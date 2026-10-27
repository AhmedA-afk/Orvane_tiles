import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { productById, sizeById } from '../data/catalog'
import { WHATSAPP_NUMBER } from '../data/site'
import { EASE_OUT } from '../lib/format'
import { useQuote } from '../lib/quote'
import { openSpecSheet, specRows } from '../lib/specSheet'
import { ChatIcon, CheckIcon, CloseIcon, DownloadIcon, PlusIcon } from './icons'
import { Surface } from './Surface'
import './TileDetail.css'

export function TileDetail({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const p = productId ? productById(productId) : undefined
  return <AnimatePresence>{p && <Panel key={p.id} productId={p.id} onClose={onClose} />}</AnimatePresence>
}

function Panel({ productId, onClose }: { productId: string; onClose: () => void }) {
  const p = productById(productId)!
  const size = sizeById(p.size)
  const { technical, packing } = specRows(p)
  const { has, toggle } = useQuote()
  const inQuote = has(p.id)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus({ preventScroll: true })
    }
  }, [onClose])

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello, I'd like a price for ${p.name} (${size.label} mm ${p.body}, ${p.finish.toLowerCase()}).`,
  )}`

  // portrait tiles get a tall frame, square ones a square frame
  const ratio = size.w / size.h

  return (
    <div className="detail-root">
      <motion.div
        className="detail-scrim"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        ref={dialogRef}
      >
        <div className="detail-visual">
          <motion.div
            layoutId={`tile-${p.id}`}
            className="detail-tile"
            data-finish={p.finish.toLowerCase()}
            style={{ aspectRatio: `${size.w} / ${size.h}`, height: ratio < 0.4 ? '100%' : undefined }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
          >
            <Surface design={p.design} />
            {/* the full-size scan fades in over the catalog-size one */}
            <Surface design={p.design} size="lg" className="detail-hires" eager />
          </motion.div>
        </div>

        <motion.div
          className="detail-body"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.15, duration: 0.45, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <button className="detail-close" onClick={onClose} ref={closeRef} aria-label="Close details">
            <CloseIcon />
          </button>
          <h3 id="detail-title" className="detail-title">
            {p.name}
          </h3>
          <p className="detail-sub">
            {size.label} mm {p.body}, {p.finish.toLowerCase()} finish. For {listRooms(p.rooms)}.
          </p>

          <div className="detail-tables">
            <SpecTable title="Technical" rows={technical} />
            <SpecTable title="Packing" rows={packing} />
          </div>
          <p className="detail-note">Certified CE and ISO 13006. Container figures assume a 26 t payload.</p>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => toggle(p.id)} aria-pressed={inQuote}>
              {inQuote ? <CheckIcon /> : <PlusIcon />}
              {inQuote ? 'In your quote' : 'Add to quote'}
            </button>
            <button className="btn btn-line" onClick={() => openSpecSheet(p)}>
              <DownloadIcon />
              Spec sheet (PDF)
            </button>
            <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener">
              <ChatIcon />
              Ask on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SpecTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section>
      <h4>{title}</h4>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="num">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const listRooms = (rooms: string[]) => {
  const r = rooms.map((x) => x.toLowerCase().replace('commercial', 'commercial spaces'))
  return r.length > 1 ? `${r.slice(0, -1).join(', ')} and ${r[r.length - 1]}` : r[0]
}
