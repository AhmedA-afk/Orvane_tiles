import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { designById, labelOf, LINES, tileUrl, type LineId } from '../data/range'
import { designsFor, type Kind, type Lay } from './state'
import { useOwnDesigns } from './uploads'

// The stone drawer: every design offered for a kind of surface, narrowed by
// line, with the chosen design's colourways as dots. The Studio and the photo
// tool both open it.

export function StonePicker({
  name,
  note,
  kind,
  lay,
  onPick,
  onClose,
}: {
  name: string
  note: string
  kind: Kind
  lay: Lay
  onPick: (l: Partial<Lay>) => void
  onClose: () => void
}) {
  const [line, setLine] = useState<LineId | 'all' | 'own'>('all')
  const own = useOwnDesigns().designs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const offered = useMemo(() => designsFor(kind), [kind, own.length])
  const list = useMemo(() => offered.filter((d) => line === 'all' || (line === 'own' ? d.own : d.line === line && !d.own)), [offered, line])
  const lines = useMemo(() => LINES.filter((l) => offered.some((d) => d.line === l.id && !d.own)), [offered])
  const d = designById(lay.design)!
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <motion.aside
      className="st-drawer"
      aria-label={`Stone for the ${name.toLowerCase()}`}
      initial={{ x: '104%' }}
      animate={{ x: 0 }}
      exit={{ x: '104%' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      data-lenis-prevent
    >
      <header className="st-drawer-head">
        <div>
          <h2 className="st-drawer-title">{name}</h2>
          <p>{note}</p>
        </div>
        <button className="st-close" onClick={onClose} aria-label="Close" data-cursor="hover">
          ×
        </button>
      </header>
      <div className="st-chips st-lines" role="radiogroup" aria-label="Line">
        {[{ id: 'all' as const, name: 'All' }, ...(own.length ? [{ id: 'own' as const, name: 'Yours' }] : []), ...lines].map((l) => (
          <button key={l.id} role="radio" aria-checked={l.id === line} onClick={() => setLine(l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      <div className="st-colourways" role="radiogroup" aria-label={`${d.name} colourways`}>
        {d.colourways.map((c) => (
          <button
            key={c.slug}
            role="radio"
            aria-checked={c.slug === lay.colourway}
            onClick={() => onPick({ colourway: c.slug })}
            aria-label={c.name}
            title={c.name}
            style={{ background: c.swatch }}
          />
        ))}
        <span>{labelOf(d, lay.colourway)}</span>
      </div>
      <ul className="st-grid">
        {list.map((x) => (
          <li key={x.id}>
            <button aria-pressed={x.id === lay.design} onClick={() => onPick({ design: x.id, colourway: x.colourways[0].slug })} data-cursor="Lay it">
              <img src={tileUrl(x.colourways[0].sm)} alt="" width={180} height={360} loading="lazy" />
              <span>{x.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.aside>
  )
}
