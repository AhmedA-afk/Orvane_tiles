import { createContext, useCallback, useContext, useRef, type MouseEvent, type ReactNode, type Ref } from 'react'
import { Link, useNavigate, type LinkProps } from 'react-router'
import { gsap, whenGsap } from './gsap'

// Page transition: the screen is tiled over, course by course from where you
// clicked, the route changes underneath, then the tiles lift from the centre
// outward. Skipped under reduced motion or before GSAP has loaded.

type Go = (to: string, from?: { x: number; y: number }) => void
const TransitionContext = createContext<Go | null>(null)

const CELL = 140

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const layer = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  const go = useCallback<Go>(
    async (to, from) => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const el = layer.current
      if (reduce || !el || !gsap || busy.current || to === location.pathname) {
        navigate(to)
        return
      }
      busy.current = true
      await whenGsap()
      const cols = Math.ceil(window.innerWidth / CELL)
      const rows = Math.ceil(window.innerHeight / CELL)
      el.style.setProperty('--cols', String(cols))
      el.replaceChildren(...Array.from({ length: cols * rows }, () => document.createElement('i')))
      el.hidden = false
      const tiles = el.children
      const origin = from
        ? [Math.floor(from.y / CELL), Math.floor(from.x / CELL)]
        : [rows - 1, Math.floor(cols / 2)]
      await gsap
        .timeline()
        .fromTo(
          tiles,
          { scale: 0, rotate: -8 },
          { scale: 1, rotate: 0, duration: 0.34, ease: 'power3.out', stagger: { grid: [rows, cols], from: origin as [number, number], amount: 0.3 } },
        )
      navigate(to)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      await gsap.to(tiles, {
        scale: 0,
        rotate: 8,
        duration: 0.34,
        ease: 'power3.in',
        stagger: { grid: [rows, cols], from: 'center', amount: 0.28 },
      })
      el.hidden = true
      el.replaceChildren()
      busy.current = false
    },
    [navigate],
  )

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div ref={layer} className="curtain" aria-hidden hidden />
    </TransitionContext.Provider>
  )
}

export function useGo() {
  const go = useContext(TransitionContext)
  if (!go) throw new Error('useGo must be used inside TransitionProvider')
  return go
}

/** A router Link that plays the tile curtain. Modified clicks behave normally. */
export function TLink({ to, onClick, ref, ...rest }: LinkProps & { to: string; ref?: Ref<HTMLAnchorElement> }) {
  const go = useGo()
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(to, { x: e.clientX, y: e.clientY })
  }
  return <Link ref={ref} to={to} onClick={handle} {...rest} />
}
