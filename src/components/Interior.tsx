import type { Interior } from '../data/range/interiors'

// An interior photograph: WebP at two widths with a JPEG behind it, its shape
// reserved so nothing jumps as it loads.

export function InteriorImage({ shot, sizes, eager = false, className = '' }: { shot: Interior; sizes: string; eager?: boolean; className?: string }) {
  const base = `/images/interiors/${shot.id}`
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={`${base}-sm.webp 800w, ${base}.webp ${shot.w}w`} sizes={sizes} />
      <img src={`${base}.jpg`} width={shot.w} height={shot.h} alt={shot.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </picture>
  )
}
