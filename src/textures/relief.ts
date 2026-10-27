import { useEffect, useState } from 'react'
import { normalSrc } from './designs'

// Carving finish: the scan's normal map is lit once from the left and once
// from the right, giving two grey overlays (128 = flat). The hero crossfades
// them as the pointer moves, so the relief seems to catch a moving light.

export interface Relief {
  left: string
  right: string
}

const cache = new Map<string, Promise<Relief>>()

function light(src: ImageData, lx: number): ImageData {
  const out = new ImageData(src.width, src.height)
  const s = src.data
  const o = out.data
  const ly = -0.3
  const lz = 0.55
  const len = Math.hypot(lx, ly, lz)
  const [Lx, Ly, Lz] = [lx / len, ly / len, lz / len]
  for (let i = 0; i < s.length; i += 4) {
    // OpenGL normal map: x right, y up
    const nx = s[i] / 127.5 - 1
    const ny = -(s[i + 1] / 127.5 - 1)
    const nz = s[i + 2] / 127.5 - 1
    const lit = nx * Lx + ny * Ly + nz * Lz - Lz
    const g = Math.max(0, Math.min(255, 128 + lit * 420))
    o[i] = o[i + 1] = o[i + 2] = g
    o[i + 3] = 255
  }
  return out
}

function build(id: string): Promise<Relief> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, c.width, c.height)
      const url = (lx: number) => {
        ctx.putImageData(light(data, lx), 0, 0)
        return c.toDataURL('image/webp', 0.85)
      }
      resolve({ left: url(-0.8), right: url(0.8) })
    }
    img.onerror = reject
    img.src = normalSrc(id)
  })
}

export function useRelief(id: string, enabled: boolean) {
  const [relief, setRelief] = useState<{ id: string; r: Relief } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    let p = cache.get(id)
    if (!p) {
      p = build(id)
      cache.set(id, p)
    }
    p.then((r) => live && setRelief({ id, r })).catch(() => {})
    return () => {
      live = false
    }
  }, [id, enabled])
  return relief?.id === id ? relief.r : undefined
}
