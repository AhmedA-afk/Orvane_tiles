import type { RefObject } from 'react'
import { gsap, MOTION, useGSAP } from './gsap'

// From the reticulos.com kit: a coloured section arrives as a sheet. It rises
// with inset sides and rounded top corners, and settles flush as it reaches
// the top of the screen. Scrubbed, so it follows the scroll exactly. Without
// motion it is simply there.
export function useWipe(ref: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      gsap.fromTo(
        ref.current,
        { clipPath: 'inset(0% 3% 0% 3% round 40px 40px 0px 0px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)',
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top 20%', scrub: true },
        },
      )
    })
  }, ref)
}
