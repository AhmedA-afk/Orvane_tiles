import { useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { gsap, useGsapEffect } from './gsap'
import { TLink } from './Transition'

// From the reticulos.com kit: a button that leans toward the pointer and rolls
// its label on hover (the label is stacked twice; hover slides the second copy
// into place). Fine pointers only; on touch it is an ordinary button.

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string
  variant?: 'primary' | 'line' | 'whatsapp' | 'light'
  strength?: number
  icon?: ReactNode
  children: ReactNode
}

export function Magnetic({ to, href, variant = 'primary', strength = 0.3, icon, children, className = '', ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)

  useGsapEffect(() => {
    const el = ref.current
    if (!el) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'expo.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'expo.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  const label = (
    <>
      {icon}
      <span className="roll">
        <span className="roll-a">{children}</span>
        <span className="roll-b" aria-hidden>
          {children}
        </span>
      </span>
    </>
  )
  const cls = `btn btn-${variant} magnetic ${className}`
  if (to)
    return (
      <TLink ref={ref} to={to} className={cls} {...rest}>
        {label}
      </TLink>
    )
  return (
    <a ref={ref} href={href} className={cls} {...rest}>
      {label}
    </a>
  )
}
