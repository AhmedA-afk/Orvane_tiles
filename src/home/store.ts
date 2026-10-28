import { useSyncExternalStore } from 'react'
import type { Finish } from '../data/catalog'

// The home page is a film. `D` is the protagonist slab's pose in screen terms
// (so the choreography holds at any aspect ratio), plus the light and the
// lens. A paused GSAP timeline writes it, scrubbed by the scroll; the 3D stage
// reads it every frame and eases towards it. Nothing here re-renders React.

export const D = {
  /** centre of the slab, as a fraction of the half-viewport (-1 left … 1 right, -1 bottom … 1 top) */
  sx: 0,
  sy: 0,
  /** slab height as a fraction of the viewport height */
  h: 0.64,
  rx: 0,
  ry: -0.5,
  rz: 0.05,
  /** 0..1: how much the slab hovers, breathes and leans to the pointer */
  float: 1,
  /** 0..1: soft contact shadow under the slab */
  shadow: 1,
  /** 0..1: the slab's presence */
  vis: 1,
  /** -1..1: the key softbox swept around the slab */
  key: -0.35,
  /** 0 light studio … 1 black studio */
  dark: 0,
  /** 0..1: the glass loupe that follows the pointer */
  lens: 0,
  /** 0..1: four sample tiles fanning out of the slab's place */
  fan: 0,
  /** 0..1: the slab lies down, becoming a floor */
  lay: 0,
}

export type Pose = typeof D

/** the intro: 0 before the page has been revealed, 1 after */
export const intro = { p: 0 }

/** live pointer, -1..1 */
export const pointer = { x: 0, y: 0, active: false }

// a tiny store for the two things React does need to know: which stone, which finish
type Look = { design: string; finish: Finish }
let look: Look = { design: 'calacatta', finish: 'Glossy' }
const subs = new Set<() => void>()
export const setLook = (next: Partial<Look>) => {
  const merged = { ...look, ...next }
  if (merged.design === look.design && merged.finish === look.finish) return
  look = merged
  subs.forEach((f) => f())
}
export const getLook = () => look
export const useLook = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => look,
  )
