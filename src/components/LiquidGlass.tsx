import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'

// Liquid glass, after Apple's material: a translucent pane that bends what is
// behind it at its rim (lensing), carries a specular highlight that follows
// the pointer, and adapts its tint to the page. The lensing is a displacement
// map generated for this element's exact size and fed to an SVG filter in
// `backdrop-filter`, which Chromium supports; elsewhere it falls back to a
// frosted pane. The map pushes samples outward near the edge, so the rim
// magnifies like a thick piece of glass.

const chromium = typeof navigator !== 'undefined' && /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent) && !/Firefox\//.test(navigator.userAgent)

const cache = new Map<string, string>()
function displacement(w: number, h: number, r: number, bezel: number) {
  const key = `${w}x${h}x${r}x${bezel}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const hw = w / 2
  const hh = h / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw
      const py = y + 0.5 - hh
      // signed distance to the rounded rectangle (negative inside)
      const qx = Math.abs(px) - (hw - r)
      const qy = Math.abs(py) - (hh - r)
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
      const d = -sd
      let dx = 0
      let dy = 0
      if (d > 0 && d < bezel) {
        let nx = 0
        let ny = 0
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1
          nx = (qx / l) * Math.sign(px)
          ny = (qy / l) * Math.sign(py)
        } else if (qx > qy) nx = Math.sign(px)
        else ny = Math.sign(py)
        const t = 1 - d / bezel
        // a convex glass profile: strongest at the very edge
        const m = Math.sin(t * Math.PI * 0.5) ** 2
        dx = nx * m
        dy = ny * m
      }
      const i = (y * w + x) * 4
      img.data[i] = 128 + dx * 127
      img.data[i + 1] = 128 + dy * 127
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const url = c.toDataURL()
  cache.set(key, url)
  return url
}

export function LiquidGlass({
  children,
  className = '',
  radius = 999,
  strength = 28,
  as: Tag = 'div',
  style,
}: {
  children: ReactNode
  className?: string
  /** corner radius in px; 999 makes a pill */
  radius?: number
  /** how far the rim bends the backdrop, in px */
  strength?: number
  as?: 'div' | 'nav' | 'span'
  style?: CSSProperties
}) {
  const el = useRef<HTMLElement>(null)
  const id = useId().replace(/:/g, '')
  const [map, setMap] = useState<{ url: string; w: number; h: number } | null>(null)

  useEffect(() => {
    const node = el.current
    if (!node || !chromium) return
    const measure = () => {
      const w = Math.round(node.offsetWidth)
      const h = Math.round(node.offsetHeight)
      if (!w || !h) return
      const r = Math.min(radius, h / 2, w / 2)
      setMap({ url: displacement(w, h, r, Math.min(22, r * 0.9, h / 2)), w, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [radius])

  // the specular highlight follows the pointer across the pane
  useEffect(() => {
    const node = el.current
    if (!node || !window.matchMedia('(hover: hover)').matches) return
    let frame = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const b = node.getBoundingClientRect()
        node.style.setProperty('--lx', `${((e.clientX - b.left) / b.width) * 100}%`)
        node.style.setProperty('--ly', `${((e.clientY - b.top) / b.height) * 100}%`)
      })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  const lens = chromium && map
  return (
    <Tag
      ref={el as never}
      className={`lg ${lens ? 'lg-lens' : ''} ${className}`}
      style={{ ...style, borderRadius: radius, ['--lg-filter' as string]: lens ? `url(#lg-${id})` : 'none' }}
    >
      {lens && (
        <svg className="lg-defs" width="0" height="0" aria-hidden focusable="false">
          <filter
            id={`lg-${id}`}
            x="0"
            y="0"
            width={map.w}
            height={map.h}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={map.url} x="0" y="0" width={map.w} height={map.h} result="map" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <span className="lg-glass" aria-hidden />
      <span className="lg-shine" aria-hidden />
      {children}
    </Tag>
  )
}
