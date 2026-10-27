import { useRef } from 'react'
import { Mark } from '../components/icons'
import { gsap, useGsapEffect } from './gsap'
import { lenisRef } from './SmoothScroll'

// From the reticulos.com kit: the page's scrollbar is a hairline rail with the
// four-tile mark as its handle, turning as the page scrolls. Drag the mark or
// click the rail to move. Fine pointers only; the native scrollbar returns the
// moment it unmounts. Wheel, keys and touch are untouched.
export function ScrollRail() {
  const rail = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)

  useGsapEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const el = rail.current
    const th = thumb.current
    if (!fine || !el || !th) return
    const spin = th.querySelector('.rail-spin')!
    const html = document.documentElement
    html.classList.add('rail-on')
    el.hidden = false

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const max = () => Math.max(1, html.scrollHeight - window.innerHeight)
    const span = () => el.clientHeight - th.offsetHeight
    const yTo = gsap.quickTo(th, 'y', { duration: reduce ? 0 : 0.35, ease: 'power3.out' })
    // the mark turns a quarter at a time, like a tile being rotated into place
    let turn = -1
    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / max()))
      yTo(p * span())
      const t = Math.round(window.scrollY / 400)
      if (t !== turn) {
        turn = t
        gsap.to(spin, { rotate: t * 90, duration: reduce ? 0 : 0.5, overwrite: true })
      }
      el.style.setProperty('--p', String(p))
    }
    const yFor = (clientY: number) => {
      const r = el.getBoundingClientRect()
      return Math.min(1, Math.max(0, (clientY - r.top - th.offsetHeight / 2) / span())) * max()
    }
    const scrollTo = (y: number, immediate = false) =>
      lenisRef.current ? lenisRef.current.scrollTo(y, { immediate }) : window.scrollTo({ top: y })

    let dragging = false
    const down = (e: PointerEvent) => {
      dragging = true
      el.classList.add('is-dragging')
      th.setPointerCapture?.(e.pointerId)
      e.preventDefault()
    }
    const move = (e: PointerEvent) => dragging && scrollTo(yFor(e.clientY), true)
    const up = () => {
      dragging = false
      el.classList.remove('is-dragging')
    }
    const jump = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.rail-thumb')) scrollTo(yFor(e.clientY))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    window.addEventListener('scroll', update, { passive: true })
    th.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('click', jump)
    return () => {
      html.classList.remove('rail-on')
      ro.disconnect()
      window.removeEventListener('scroll', update)
      th.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('click', jump)
    }
  }, [])

  return (
    <div ref={rail} className="rail" aria-hidden hidden>
      <span className="rail-fill" />
      <span ref={thumb} className="rail-thumb">
        <span className="rail-spin">
          <Mark />
        </span>
      </span>
    </div>
  )
}
