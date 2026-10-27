import { animate, useInView, useMotionValue, useTransform, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

/** Counts to `value` when it first scrolls into view, then tweens on change. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)

  useEffect(() => {
    if (!inView) return
    const c = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [inView, value, mv])

  return (
    <motion.span ref={ref} className="num">
      {text}
    </motion.span>
  )
}
