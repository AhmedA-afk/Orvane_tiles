import type { CSSProperties, ReactNode } from 'react'
import { Split } from '../motion/Split'
import './PageHero.css'

// Inner-page headline, as on reticulos.com: line one rises out of its slots,
// line two drops in from above and sits right-aligned on wide screens.
export function PageHero({ l1, l2, sub, children }: { l1: string; l2: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="wrap page-hero">
      <h1 className="page-h1" aria-label={`${l1} ${l2}`}>
        <span className="page-l rise" style={{ '--delay': '0.05s' } as CSSProperties}>
          <Split text={l1} />
        </span>
        <span className="page-l page-l2 drop" style={{ '--delay': '0.2s' } as CSSProperties}>
          <Split text={l2} />
        </span>
      </h1>
      {sub && <p className="lede page-sub">{sub}</p>}
      {children}
    </header>
  )
}
