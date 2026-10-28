import { useEffect, useRef, useState } from 'react'

// The first moment of a visit: a slab-shaped frame fills with stone from the
// bottom while a counter runs, the name rises, then the whole sheet lifts away
// like a slab being raised. Once per session; skipped under reduced motion.
// `ready` says when the page behind is ready to be seen.

export function Preloader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [show] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
      return sessionStorage.getItem('orvane-intro') !== '1'
    } catch {
      return false
    }
  })
  const [n, setN] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(!show)
  const start = useRef(performance.now())
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (!show) {
      done.current()
      return
    }
    let frame = 0
    const tick = () => {
      const t = (performance.now() - start.current) / 1000
      // the count runs to 90 on its own and finishes once the page is ready
      const target = ready ? 100 : Math.min(90, t * 70)
      setN((v) => Math.min(100, v + Math.max(0.6, (target - v) * 0.12)))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [show, ready])

  useEffect(() => {
    if (!show || leaving || n < 100) return
    const t = (performance.now() - start.current) / 1000
    const wait = Math.max(0, 1.5 - t) * 1000
    const id = setTimeout(() => {
      setLeaving(true)
      try {
        sessionStorage.setItem('orvane-intro', '1')
      } catch {
        /* private mode: the intro simply plays again */
      }
      setTimeout(() => done.current(), 450)
      setTimeout(() => setGone(true), 1300)
    }, wait)
    return () => clearTimeout(id)
  }, [n, show, leaving])

  if (gone) return null
  const v = Math.round(n)
  return (
    <div className="pre" data-leaving={leaving ? '' : undefined} aria-hidden>
      <div className="pre-slab">
        <span className="pre-fill" style={{ transform: `scaleY(${n / 100})` }} />
      </div>
      <p className="pre-word">
        {'Orvane'.split('').map((c, i) => (
          <span key={i} style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
            {c}
          </span>
        ))}
      </p>
      <p className="pre-count mono">{String(v).padStart(3, '0')}</p>
      <p className="pre-note mono">Porcelain slabs · Morbi</p>
    </div>
  )
}
