import { useEffect, useRef, useState } from 'react'

// A soft cursor for fine pointers: a small dot that trails the pointer and
// grows into a labelled pill over anything marked data-cursor (a link, a
// "Drag" strip, the "Inspect" lens). The native cursor stays for text fields.

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [mode, setMode] = useState<'' | 'hover' | 'label' | 'down'>('')

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const el = dot.current
    if (!fine || !el) return
    document.documentElement.classList.add('has-cursor')
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let frame = 0
    const loop = () => {
      cx += (x - cx) * 0.22
      cy += (y - cy) * 0.22
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      frame = requestAnimationFrame(loop)
    }
    loop()
    // pills lean a few pixels towards the pointer, and settle back when it leaves
    let pulled: HTMLElement | null = null
    const release = () => {
      if (!pulled) return
      pulled.style.transform = ''
      pulled = null
    }
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      el.style.opacity = '1'
      const pill = (e.target as Element).closest?.('.btn, .o-btn') as HTMLElement | null
      if (pill !== pulled) release()
      if (pill) {
        const b = pill.getBoundingClientRect()
        const dx = (x - (b.left + b.width / 2)) * 0.18
        const dy = (y - (b.top + b.height / 2)) * 0.28
        pill.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
        pulled = pill
      }
    }
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest?.('[data-cursor], a, button, [role="radio"], [role="button"]')
      if (!t) {
        setMode('')
        setLabel('')
        return
      }
      const c = t.getAttribute('data-cursor')
      if (c && c !== 'hover') {
        setMode('label')
        setLabel(c)
      } else {
        setMode('hover')
        setLabel('')
      }
    }
    const down = () => el.classList.add('is-down')
    const up = () => el.classList.remove('is-down')
    const leave = () => (el.style.opacity = '0')
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      release()
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div ref={dot} className="cursor" data-mode={mode} aria-hidden>
      <span className="cursor-label">{label}</span>
    </div>
  )
}
