import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { InteriorCarousel } from '../components/InteriorCarousel'
import { LiquidGlass } from '../components/LiquidGlass'
import { interiorsIn } from '../data/range/interiors'
import {
  COLOUR_FAMILIES,
  COUNTS,
  FINISHES,
  formatById,
  LINES,
  lineById,
  RANGE,
  THICKNESSES,
  type Colourway,
  type RangeDesign,
} from '../data/range'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import './collections.css'

// The collection: every design in the range as a studio render on a card,
// grouped by line, narrowed by glass menus (line, look, colour, finish, size,
// thickness). A card's colourway dots switch its render; a card opens the
// design's configurator, in the colourway the filters asked for.

type Key = 'line' | 'look' | 'colour' | 'finish' | 'kind' | 'mm'
type Filters = Record<Key, string[]>
const EMPTY: Filters = { line: [], look: [], colour: [], finish: [], kind: [], mm: [] }

const LOOKS = ['marble', 'onyx', 'travertine', 'granite', 'stone', 'concrete', 'terrazzo', 'wood', 'metal', 'solid']
const KINDS: { id: string; label: string }[] = [
  { id: 'tile', label: 'Tiles' },
  { id: 'plank', label: 'Planks' },
  { id: 'slab', label: 'Slabs' },
  { id: 'xxl', label: 'Oversize slabs' },
]
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const GROUPS: { key: Key; label: string; options: { value: string; label: string; swatch?: string }[] }[] = [
  { key: 'line', label: 'Line', options: LINES.map((l) => ({ value: l.id, label: `${l.name} · ${l.kind}` })) },
  { key: 'look', label: 'Look', options: LOOKS.map((l) => ({ value: l, label: cap(l) })) },
  { key: 'colour', label: 'Colour', options: COLOUR_FAMILIES.map((c) => ({ value: c.id, label: c.id, swatch: c.swatch })) },
  { key: 'finish', label: 'Finish', options: FINISHES.map((f) => ({ value: f.id, label: f.name })) },
  { key: 'kind', label: 'Size', options: KINDS.map((k) => ({ value: k.id, label: k.label })) },
  { key: 'mm', label: 'Thickness', options: THICKNESSES.map((t) => ({ value: String(t.mm), label: t.label })) },
]

// two rooms from every line, in line order, for the carousel at the top
const ROOMS = LINES.flatMap((l) => interiorsIn(l.id).slice(0, 2))

const kindsOf = (d: RangeDesign) => new Set<string>(lineById(d.line).formats.map((f) => formatById(f)!.kind))
function has(d: RangeDesign, key: Key, v: string) {
  const line = lineById(d.line)
  switch (key) {
    case 'line':
      return d.line === v
    case 'look':
      return d.look === v
    case 'colour':
      return d.colourways.some((c) => c.family === v)
    case 'finish':
      return (line.finishes as string[]).includes(v)
    case 'kind':
      return kindsOf(d).has(v)
    case 'mm':
      return line.thicknesses.includes(Number(v))
  }
}
const matches = (d: RangeDesign, f: Filters) => (Object.keys(f) as Key[]).every((k) => !f[k].length || f[k].some((v) => has(d, k, v)))

export default function Collections() {
  const [params] = useSearchParams()
  // the first version of the site linked designs as /collections?design=id
  const legacy = params.get('design')
  if (legacy && RANGE.some((d) => d.id === legacy)) return <Navigate to={`/collections/${legacy}`} replace />
  return <Catalogue />
}

function Catalogue() {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [menu, setMenu] = useState<Key | null>(null)
  const results = useMemo(() => RANGE.filter((d) => matches(d, filters)), [filters])
  const any = Object.values(filters).some((v) => v.length)
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  useReveal(root, any)

  // a menu closes on a click elsewhere or on Escape
  useEffect(() => {
    if (!menu) return
    const click = (e: PointerEvent) => !bar.current?.contains(e.target as Node) && setMenu(null)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    document.addEventListener('pointerdown', click)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', click)
      document.removeEventListener('keydown', key)
    }
  }, [menu])

  const toggle = (key: Key, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  // the colourway a card opens with: the first one in a chosen colour
  const pick = (d: RangeDesign): Colourway => d.colourways.find((c) => filters.colour.includes(c.family)) ?? d.colourways[0]

  return (
    <div className="cl" ref={root}>
      <header className="cl-head">
        <p className="kicker mono" data-rv>
          <span>Collection 2026</span>
          <span>{COUNTS.designs} designs</span>
          <span>{COUNTS.lines} lines</span>
          <span>{COUNTS.colourways} colourways</span>
          <span>{COUNTS.formats} formats</span>
        </p>
        <h1 className="cl-title o-lines" data-rv>
          <span>
            <span>Collection</span>
          </span>
        </h1>
        <p className="cl-lede lead" data-rv>
          Every design is rendered from the scan it is printed from. Open one to configure it: colour, size, thickness
          and finish, live.{' '}
          <TLink className="u" to="/downloads">
            Or take it all as a catalogue.
          </TLink>
        </p>
      </header>

      <div className="cl-rooms">
        <InteriorCarousel shots={ROOMS} label="Rooms from the range" showLine />
      </div>

      <div className="cl-bar-wrap" ref={bar}>
        <LiquidGlass className="cl-bar" strength={18}>
          <div className="cl-menus" role="group" aria-label="Filter designs">
            {GROUPS.map((g) => (
              <Menu
                key={g.key}
                label={g.label}
                options={g.options.map((o) => ({ ...o, n: RANGE.filter((d) => has(d, g.key, o.value)).length }))}
                chosen={filters[g.key]}
                open={menu === g.key}
                onOpen={() => setMenu(menu === g.key ? null : g.key)}
                onToggle={(v) => toggle(g.key, v)}
              />
            ))}
          </div>
          <span className="cl-count mono" aria-live="polite">
            {results.length}
            <span className="muted"> / {RANGE.length}</span>
          </span>
          <AnimatePresence initial={false}>
            {any && (
              <motion.button
                className="cl-clear"
                onClick={() => setFilters(EMPTY)}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                data-cursor="hover"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </LiquidGlass>
      </div>

      {any ? (
        <motion.ul className="cl-grid" layout>
          <AnimatePresence mode="popLayout">
            {results.map((d, i) => (
              <Card key={d.id} design={d} order={i} start={pick(d)} />
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        LINES.map((l) => {
          const ds = RANGE.filter((d) => d.line === l.id)
          return (
            <section key={l.id} className="cl-line" aria-labelledby={`line-${l.id}`}>
              <header className="cl-line-head" data-rv>
                <div>
                  <p className="mono muted">
                    {l.kind} · {ds.length} designs
                  </p>
                  <h2 id={`line-${l.id}`} className="cl-line-name">
                    {l.name}
                  </h2>
                </div>
                <p className="cl-line-tag">{l.tagline}</p>
                <TLink to={`/lines/${l.id}`} className="btn btn-line btn-sm btn-arrow" data-cursor="hover">
                  The line
                </TLink>
              </header>
              <ul className="cl-grid">
                {ds.map((d, i) => (
                  <Card key={d.id} design={d} order={i} start={d.colourways[0]} />
                ))}
              </ul>
            </section>
          )
        })
      )}
      {results.length === 0 && (
        <p className="cl-empty lead">
          Nothing matches all of those.{' '}
          <button className="u" onClick={() => setFilters(EMPTY)}>
            Show every design
          </button>
        </p>
      )}
    </div>
  )
}

function Menu({
  label,
  options,
  chosen,
  open,
  onOpen,
  onToggle,
}: {
  label: string
  options: { value: string; label: string; n: number; swatch?: string }[]
  chosen: string[]
  open: boolean
  onOpen: () => void
  onToggle: (value: string) => void
}) {
  const id = `menu-${label.toLowerCase()}`
  return (
    <div className="cl-menu">
      <button className="cl-menu-btn" aria-expanded={open} aria-controls={id} onClick={onOpen} data-cursor="hover">
        {label}
        <AnimatePresence initial={false}>
          {chosen.length > 0 && (
            <motion.b initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
              {chosen.length}
            </motion.b>
          )}
        </AnimatePresence>
        <i aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            className={`cl-pop${options.length > 8 ? ' is-cols' : ''}`}
            role="group"
            aria-label={label}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map((o) => (
              <button key={o.value} role="checkbox" aria-checked={chosen.includes(o.value)} onClick={() => onToggle(o.value)} disabled={!o.n}>
                {o.swatch ? <span className="cl-swatch" style={{ background: o.swatch }} aria-hidden /> : <span className="cl-check" aria-hidden />}
                <span>{o.label}</span>
                <span className="mono muted">{o.n}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Card({ design: d, order, start }: { design: RangeDesign; order: number; start: Colourway }) {
  // a hovered dot previews a colourway, a clicked one keeps it; otherwise the filters' choice
  const [hovered, setHovered] = useState<Colourway | null>(null)
  const [chosen, setChosen] = useState<Colourway | null>(null)
  const cw = hovered ?? chosen ?? start
  const line = lineById(d.line)
  return (
    <motion.li
      layout
      className="cl-card"
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(order, 9) * 0.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
    >
      <TLink className="cl-open" to={`/collections/${d.id}?cw=${cw.slug}`} data-cursor="Configure">
        <span className="cl-media">
          <AnimatePresence initial={false}>
            <motion.img
              key={cw.slug}
              src={`/renders/range/${d.id}--${cw.slug}.jpg`}
              alt=""
              width={720}
              height={960}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          </AnimatePresence>
          <span className="cl-no mono">{line.name}</span>
          <span className="cl-finish mono">{d.look}</span>
        </span>
        <span className="cl-name">{d.name}</span>
        <span className="cl-spec mono">
          {cw.name} · {d.colourways.length} colourway{d.colourways.length > 1 ? 's' : ''}
        </span>
      </TLink>
      {d.colourways.length > 1 && (
        <span className="cl-dots" role="group" aria-label={`${d.name} colourways`} onPointerLeave={() => setHovered(null)}>
          {d.colourways.map((c) => (
            <button
              key={c.slug}
              aria-label={c.name}
              aria-pressed={c.slug === cw.slug}
              onPointerEnter={() => setHovered(c)}
              onFocus={() => setHovered(c)}
              onClick={() => setChosen(c)}
              style={{ backgroundImage: `url(/tiles/${c.sm})` }}
            />
          ))}
        </span>
      )}
    </motion.li>
  )
}
