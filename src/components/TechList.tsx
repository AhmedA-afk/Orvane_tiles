import { techById, type TechId } from '../data/range'
import { TLink } from '../motion/Transition'
import { DemoNote } from './Demo'

// The technologies as a numbered list, each with a small drawing of what it
// does: a reflection held true, the ramp a sole stays on, a surface that keeps
// clean, veins that run on across slabs, colour through the body, sunlight
// sent back. The drawings trace themselves in as the row arrives.

const DRAWINGS: Record<TechId, React.ReactNode> = {
  specchio: (
    <>
      <path d="M20 118 L220 118" />
      <path d="M60 30 L120 118 L180 30" className="t-ray" />
      <path d="M100 118 A20 20 0 0 1 120 98 A20 20 0 0 1 140 118" className="t-faint" />
      <rect x="44" y="14" width="32" height="20" rx="2" className="t-faint" />
      <path d="M20 128 L220 128" className="t-faint" />
    </>
  ),
  presa: (
    <>
      <path d="M20 128 L220 128" />
      <path d="M40 128 L210 58" />
      <path d="M150 128 A110 110 0 0 0 141.7 86.1" className="t-faint" />
      <rect x="118" y="78" width="34" height="14" rx="7" transform="rotate(-22.4 135 85)" />
      <text x="158" y="112" className="t-text">
        19–27°
      </text>
    </>
  ),
  puro: (
    <>
      <path d="M20 118 L220 118" />
      {[30, 48, 62, 80, 94, 112, 130, 152, 176, 200].map((x, i) => (
        <circle key={x} cx={x} cy={96 - (i % 3) * 14} r={Math.max(1.5, 6 - i * 0.55)} className={i > 5 ? 't-faint' : ''} />
      ))}
    </>
  ),
  vena: (
    <>
      {[20, 72, 124, 176].map((x) => (
        <rect key={x} x={x} y="24" width="46" height="100" rx="2" />
      ))}
      <path d="M20 60 C60 40, 90 90, 130 70 S190 40, 222 58" className="t-ray" />
      <path d="M20 96 C70 110, 100 70, 150 88 S200 112, 222 100" className="t-faint" />
    </>
  ),
  corpo: (
    <>
      <path d="M30 60 L180 60 L210 90 L210 110 L30 110 Z" />
      {[70, 80, 90, 100].map((y, i) => (
        <path key={y} d={`M30 ${y} C80 ${y - 6 + i * 2}, 130 ${y + 6}, ${180 + (y - 60)} ${y}`} className={i % 2 ? 't-faint' : 't-ray'} />
      ))}
      <path d="M180 60 L210 90" className="t-faint" />
    </>
  ),
  ombra: (
    <>
      <circle cx="44" cy="36" r="14" />
      <path d="M58 46 L120 116 L200 40" className="t-ray" />
      <path d="M66 40 L126 116" className="t-faint" />
      <path d="M20 118 L220 118" />
      <path d="M20 126 L220 126" className="t-faint" />
    </>
  ),
}

/** where each technology is shown at work */
export const TECH_FILM: Record<TechId, { to: string; label: string }> = {
  specchio: { to: '/technology/surface-lab', label: 'Read it on the gloss meter' },
  presa: { to: '/technology/surface-lab', label: 'Tilt it on the ramp' },
  puro: { to: '/technology/surface-lab', label: 'Spill on it' },
  vena: { to: '/technology/vein', label: 'Watch four slabs fall into line' },
  corpo: { to: '/technology/scale', label: 'See the edge of a slab' },
  ombra: { to: '/spaces/outdoors', label: 'See it outdoors' },
}

export function TechList({ techs, links = false }: { techs: TechId[]; links?: boolean }) {
  return (
    <div className="tl">
      <ol className="tl-list">
        {techs.map((id, i) => {
          const t = techById(id)
          return (
            <li key={id} className="tl-row" data-rv>
              <span className="tl-no mono">{String(i + 1).padStart(2, '0')}</span>
              <div className="tl-head">
                <h3 className="tl-name">{t.name}</h3>
                <p className="mono muted">{t.kind}</p>
              </div>
              <div className="tl-copy">
                <p className="tl-claim">{t.claim}</p>
                <p className="muted">{t.detail}</p>
                {links && (
                  <TLink className="u tl-link" to={TECH_FILM[id].to}>
                    {TECH_FILM[id].label} →
                  </TLink>
                )}
              </div>
              <svg className="tl-svg" viewBox="0 0 240 150" aria-hidden>
                {DRAWINGS[id]}
              </svg>
            </li>
          )
        })}
      </ol>
      <DemoNote topic="technology" />
    </div>
  )
}
