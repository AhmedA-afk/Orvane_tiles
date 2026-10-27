import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { TLink } from '../motion/Transition'
import { BRAND, LANGUAGES } from '../data/site'
import { useQuote } from '../lib/quote'
import { CloseIcon, GlobeIcon, Mark, MenuIcon } from './icons'
import './Nav.css'

const LINKS = [
  { href: '/collections', label: 'Collections' },
  { href: '/visualizer', label: 'Visualizer' },
  { href: '/export', label: 'Container load' },
  { href: '/factory', label: 'Factory' },
]

export function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const { items } = useQuote()
  const { pathname } = useLocation()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12))

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : ''
  }, [menu])

  return (
    <header className="nav" data-scrolled={scrolled || menu ? '' : undefined}>
      <div className="wrap nav-row">
        <TLink className="brand" to="/" aria-label={`${BRAND}, home`}>
          <Mark className="brand-mark" />
          <span>{BRAND}</span>
        </TLink>

        <nav className="nav-links" aria-label="Sections">
          {LINKS.map((l) => (
            <TLink key={l.href} to={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </TLink>
          ))}
        </nav>

        <div className="nav-actions">
          <LanguageMenu />
          <a className="nav-dealer" href="#dealers">
            Dealer login
          </a>
          <TLink className="btn btn-primary nav-quote" to="/quote">
            <span className="nav-quote-long">Get a quote</span>
            <span className="nav-quote-short">Quote</span>
            <AnimatePresence initial={false} mode="popLayout">
              {items.length > 0 && (
                <motion.span
                  key={items.length}
                  className="nav-count num"
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  aria-label={`${items.length} designs in your quote`}
                >
                  {items.length}
                </motion.span>
              )}
            </AnimatePresence>
          </TLink>
          <button
            className="nav-burger"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.nav
            className="nav-sheet"
            aria-label="Sections"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="wrap">
              {[...LINKS, { href: '/quote', label: 'Get a quote' }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TLink to={l.href} onClick={() => setMenu(false)}>
                    {l.label}
                  </TLink>
                </motion.div>
              ))}
              <p className="nav-sheet-langs">
                {LANGUAGES.map((l) => (
                  <span key={l.code} lang={l.code}>
                    {l.label}
                    {!l.ready && ' (soon)'}
                  </span>
                ))}
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

function LanguageMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="lang" ref={ref}>
      <button className="lang-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <GlobeIcon />
        <span>EN</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="lang-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {LANGUAGES.map((l) => (
              <li key={l.code}>
                <button
                  lang={l.code}
                  disabled={!l.ready}
                  aria-current={l.code === 'en' ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>{l.label}</span>
                  {!l.ready && <small lang="en">Coming soon</small>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
