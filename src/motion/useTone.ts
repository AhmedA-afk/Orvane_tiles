import { useEffect } from 'react'

/**
 * The navigation floats over every page, so its ink follows what is under it:
 * while an element marked data-zone="dark" passes beneath the bar, html gets
 * data-tone="dark". (The home page sets the tone from its film instead.)
 */
export function useTone(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const zones = [...(root.current?.querySelectorAll('[data-zone="dark"]') ?? [])]
    const html = document.documentElement
    if (!zones.length) return
    const under = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) under.add(e.target)
          else under.delete(e.target)
        }
        html.dataset.tone = under.size ? 'dark' : 'light'
      },
      // a thin band where the bar sits, from 4% to 6% down the screen
      { rootMargin: '-4% 0px -94% 0px' },
    )
    zones.forEach((z) => io.observe(z))
    return () => {
      io.disconnect()
      delete html.dataset.tone
    }
  }, [root])
}
