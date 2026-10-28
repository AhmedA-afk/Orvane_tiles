import { useEffect } from 'react'

/**
 * Parts marked data-rv rise into place, once, when their top passes 88% of
 * the screen, or when a jump scrolls past them. Siblings stagger by 80ms; an
 * .o-lines heading lifts line by line. The hidden state only exists once this
 * has run, so without script everything is simply there.
 */
export function useReveal(root: React.RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let items = [...el.querySelectorAll<HTMLElement>('[data-rv]:not(.is-in)')]
    const seen = new Map<Element, number>()
    for (const item of items) {
      const n = seen.get(item.parentElement!) ?? 0
      seen.set(item.parentElement!, n + 1)
      item.style.setProperty('--rv-i', String(n))
    }
    el.classList.add('rv-ready')
    let frame = 0
    const check = () => {
      frame = 0
      const line = window.innerHeight * 0.88
      items = items.filter((item) => {
        if (item.getBoundingClientRect().top > line) return true
        item.classList.add('is-in')
        return false
      })
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [root, key])
}
