// Ported from the reticulos.com motion kit. One place that loads GSAP, so every
// section shares an instance. It is fetched only after the page has painted:
// `gsap` and `ScrollTrigger` stay null until whenGsap() resolves, and every
// caller touches them inside a setup that runs after that.
import { useEffect, type RefObject } from 'react'

type Gsap = typeof import('gsap').gsap
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger
type Split = typeof import('gsap/SplitText').SplitText

export let gsap: Gsap = null as unknown as Gsap
export let ScrollTrigger: ST = null as unknown as ST
export let SplitText: Split = null as unknown as Split

let loading: Promise<void> | null = null
export function whenGsap() {
  loading ||= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/SplitText')]).then(
    ([g, st, sp]) => {
      gsap = g.gsap
      ScrollTrigger = st.ScrollTrigger
      SplitText = sp.SplitText
      gsap.registerPlugin(ScrollTrigger, SplitText)
      gsap.defaults({ ease: 'expo.out' })
    },
  )
  return loading
}

// Animations are only created inside these conditions. Outside them (reduced
// motion, or before JS runs) every element sits in its final, readable state.
export const MOTION = '(prefers-reduced-motion: no-preference)'
export const DESKTOP = '(min-width: 900px)'

// Each setup runs in its own task once GSAP has loaded, in mount order (which
// is document order), so ScrollTriggers and pins are still created top to
// bottom without one long blocking task.
const queue: (() => void)[] = []
let pumping = false
const nextTask = (fn: () => void) => setTimeout(fn, 0)
function pump() {
  queue.shift()?.()
  if (queue.length) return nextTask(pump)
  pumping = false
  nextTask(() => ScrollTrigger.refresh())
}

/** gsap.context(setup, scope), created after paint and reverted on unmount. */
export function useGSAP(setup: () => void, scope?: RefObject<Element | null>) {
  useEffect(() => {
    let ctx: ReturnType<Gsap['context']> | undefined
    let gone = false
    queue.push(() => {
      if (!gone) ctx = gsap.context(setup, scope?.current ?? undefined)
    })
    if (!pumping) {
      pumping = true
      whenGsap().then(() => nextTask(pump))
    }
    return () => {
      gone = true
      ctx?.revert()
    }
    // Set up once per mount, as every caller expects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** useEffect for code that needs GSAP but isn't a timeline setup. */
export function useGsapEffect(effect: () => void | (() => void), deps: unknown[]) {
  useEffect(() => {
    let cleanup: void | (() => void)
    let gone = false
    whenGsap().then(() => {
      if (!gone) cleanup = effect()
    })
    return () => {
      gone = true
      if (typeof cleanup === 'function') cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
