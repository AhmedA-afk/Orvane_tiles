import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type CSSProperties } from 'react'
import {
  BODIES,
  FINISHES,
  PRODUCTS,
  ROOMS,
  SIZES,
  sizeById,
  type Body,
  type Finish,
  type Product,
  type Room,
  type SizeId,
} from '../data/catalog'
import { useQuote } from '../lib/quote'
import { CheckIcon, PlusIcon } from './icons'
import { Surface } from './Surface'
import { TileDetail } from './TileDetail'
import './Catalog.css'

interface Filters {
  size: SizeId[]
  finish: Finish[]
  body: Body[]
  room: Room[]
}

const EMPTY: Filters = { size: [], finish: [], body: [], room: [] }

const GROUPS: { key: keyof Filters; label: string; options: { value: string; label: string }[] }[] = [
  { key: 'size', label: 'Size (mm)', options: SIZES.map((s) => ({ value: s.id, label: s.label })) },
  { key: 'finish', label: 'Finish', options: FINISHES.map((f) => ({ value: f, label: f })) },
  { key: 'body', label: 'Body', options: BODIES.map((b) => ({ value: b, label: b })) },
  { key: 'room', label: 'Room', options: ROOMS.map((r) => ({ value: r, label: r })) },
]

const matches = (p: Product, f: Filters) =>
  (!f.size.length || f.size.includes(p.size)) &&
  (!f.finish.length || f.finish.includes(p.finish)) &&
  (!f.body.length || f.body.includes(p.body)) &&
  (!f.room.length || p.rooms.some((r) => f.room.includes(r)))

export function Catalog() {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [open, setOpen] = useState<string | null>(null)
  const results = useMemo(() => PRODUCTS.filter((p) => matches(p, filters)), [filters])
  const active = Object.values(filters).some((v) => v.length)

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((f) => {
      const cur = f[key] as string[]
      return { ...f, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] }
    })

  return (
    <section className="catalog" id="catalog" aria-label="Catalog">
      <div className="wrap">

        <div className="cat-layout">
          <div className="filters" role="group" aria-label="Filter designs">
            {GROUPS.map((g) => (
              <fieldset key={g.key} className="filter-group">
                <legend>{g.label}</legend>
                <div className="filter-chips">
                  {g.options.map((o) => (
                    <button
                      key={o.value}
                      className="chip"
                      aria-pressed={(filters[g.key] as string[]).includes(o.value)}
                      onClick={() => toggle(g.key, o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="cat-results">
            <div className="cat-bar">
              <p aria-live="polite">
                <strong className="num">{results.length}</strong> {results.length === 1 ? 'design' : 'designs'}
              </p>
              <div className="scale-bar" aria-hidden>
                <span />1 m
              </div>
              {active && (
                <button className="cat-clear" onClick={() => setFilters(EMPTY)}>
                  Clear filters
                </button>
              )}
            </div>

            <motion.ul className="cat-grid" layout>
              <AnimatePresence mode="popLayout">
                {results.map((p) => (
                  <Card key={p.id} product={p} onOpen={() => setOpen(p.id)} />
                ))}
              </AnimatePresence>
            </motion.ul>

            {results.length === 0 && (
              <div className="cat-empty">
                <p>No designs match all of these filters. Remove a size or a finish to see more.</p>
                <button className="btn btn-line" onClick={() => setFilters(EMPTY)}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TileDetail productId={open} onClose={() => setOpen(null)} />
    </section>
  )
}

function Card({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  const size = sizeById(p.size)
  const { has, toggle } = useQuote()
  const inQuote = has(p.id)

  return (
    <motion.li
      layout
      className="card"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
    >
      <button className="card-open" onClick={onOpen} aria-label={`${p.name}, ${size.label} mm. Open details`}>
        <div className="rack">
          <motion.div
            layoutId={`tile-${p.id}`}
            className="rack-tile"
            data-finish={p.finish.toLowerCase()}
            style={{ '--mm-w': size.w, '--mm-h': size.h } as CSSProperties}
          >
            <Surface design={p.design} />
          </motion.div>
        </div>
        <span className="card-name">{p.name}</span>
        <span className="card-spec">
          {size.label} mm, {p.body}, {p.finish.toLowerCase()}
        </span>
      </button>
      <button className="card-add" aria-pressed={inQuote} onClick={() => toggle(p.id)}>
        {inQuote ? <CheckIcon /> : <PlusIcon />}
        <span>{inQuote ? 'In your quote' : 'Add to quote'}</span>
      </button>
    </motion.li>
  )
}
