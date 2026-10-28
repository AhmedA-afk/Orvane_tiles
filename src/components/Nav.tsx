import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useQuote } from '../lib/quote'
import { TLink } from '../motion/Transition'
import { LiquidGlass } from './LiquidGlass'

// The site's navigation: the wordmark on the left, the sections in a pane of
// liquid glass at the centre, the sample box on the right. Its ink follows the
// chapter underneath (html[data-tone]). On a phone: the wordmark and a Menu
// pane that opens a full-screen index.

export const NAV_LINKS = [
  { to: '/lines', label: 'Lines' },
  { to: '/collections', label: 'Collection' },
  { to: '/spaces', label: 'Spaces' },
  { to: '/technology', label: 'Technology' },
  { to: '/factory', label: 'Factory' },
  { to: '/export', label: 'Export' },
]

export function Nav() {
  const { pathname } = useLocation()
  const { items } = useQuote()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])

  return (
    <>
      <header className="nav">
        <TLink className="nav-mark" to="/" aria-label="Orvane Ceramica, home">
          <svg viewBox="0 0 14 28" aria-hidden className="nav-glyph">
            <rect x="0.75" y="0.75" width="12.5" height="26.5" rx="1" />
          </svg>
          <span>Orvane</span>
        </TLink>

        <LiquidGlass as="nav" className="nav-pill" strength={22}>
          {NAV_LINKS.map((l) => (
            <TLink key={l.to} to={l.to} aria-current={pathname.startsWith(l.to) ? 'page' : undefined} data-cursor="hover">
              <span className="roll" data-text={l.label}>
                {l.label}
              </span>
            </TLink>
          ))}
        </LiquidGlass>

        <div className="nav-end">
          <LiquidGlass className="nav-box" strength={18}>
            <TLink to="/quote" data-cursor="hover" aria-label={`Sample box, ${items.length} designs`}>
              <span>Sample box</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.b
                  key={items.length}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {items.length}
                </motion.b>
              </AnimatePresence>
            </TLink>
          </LiquidGlass>
          <LiquidGlass className="nav-menu" strength={16}>
            <button aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? 'Close' : 'Menu'}
            </button>
          </LiquidGlass>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: 'inset(0 0 100% 0 round 0 0 32px 32px)' }}
            animate={{ clipPath: 'inset(0 0 0% 0 round 0 0 0px 0px)' }}
            exit={{ clipPath: 'inset(0 0 100% 0 round 0 0 32px 32px)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Site">
              {[{ to: '/', label: 'Home' }, ...NAV_LINKS, { to: '/studio', label: 'Studio' }, { to: '/quote', label: 'Sample box' }].map((l, i) => (
                <motion.span
                  key={l.to}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 0.18 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TLink to={l.to}>{l.label}</TLink>
                </motion.span>
              ))}
            </nav>
            <p className="sheet-note">Orvane Ceramica is a demo company. Everything on this site is sample data.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
