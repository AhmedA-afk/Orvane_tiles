import { useEffect } from 'react'
import { useLocation } from 'react-router'
import type Lenis from 'lenis'
import { gsap, ScrollTrigger, useGsapEffect } from './gsap'

// The page's Lenis instance, for code that scrolls programmatically.
export const lenisRef: { current: Lenis | null } = { current: null }

/**
 * Inertial scrolling driven by GSAP's ticker, so ScrollTrigger and Lenis agree
 * on every frame. Skipped under reduced motion. Each route starts at the top.
 */
export function SmoothScroll() {
  const { pathname } = useLocation()

  useGsapEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tick: ((t: number) => void) | null = null
    let gone = false
    if (!reduce)
      import('lenis').then(({ default: L }) => {
        if (gone) return
        const lenis = new L({ autoRaf: false, anchors: { offset: -80 }, lerp: 0.1 })
        lenis.on('scroll', ScrollTrigger.update)
        tick = (time) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
        lenisRef.current = lenis
      })
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      gone = true
      window.removeEventListener('load', refresh)
      if (tick) gsap.ticker.remove(tick)
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return null
}
