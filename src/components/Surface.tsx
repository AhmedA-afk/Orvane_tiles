import { useState, type CSSProperties } from 'react'
import { DESIGNS, tileSrc } from '../textures/designs'
import './Surface.css'

interface Props {
  design: string
  size?: 'lg' | 'sm'
  className?: string
  style?: CSSProperties
  /** object-position, to cut different "faces" from one scan */
  position?: string
  eager?: boolean
}

/** A tile face: the scan's average colour until the photo has loaded. */
export function Surface({ design, size = 'sm', className, style, position, eager }: Props) {
  const d = DESIGNS[design]
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`surface ${className ?? ''}`} style={{ backgroundColor: d.base, ...style }}>
      <img
        key={design + size}
        src={tileSrc(design, size)}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        data-ready={loaded ? '' : undefined}
        onLoad={() => setLoaded(true)}
        style={{ objectPosition: position }}
      />
    </div>
  )
}
