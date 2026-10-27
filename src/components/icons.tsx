import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true } as const

export const ChatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 9 19.2z" strokeLinejoin="round" />
    <path d="M9.2 9.3c.3 1.9 1.6 3.4 3.5 4.1l1-1 1.6.8-.3 1.3c-3.2.2-6.4-2.8-6.4-6l1.3-.3.8 1.6z" fill="currentColor" stroke="none" />
  </svg>
)

export const DownloadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
)

export const GlobeIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
  </svg>
)

export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" strokeLinecap="round" />
  </svg>
)

/** Four tiles laid with a grout gap, one turned to cobalt. */
export const Mark = (p: P) => (
  <svg viewBox="0 0 28 28" aria-hidden {...p}>
    <rect x="1" y="1" width="12" height="12" rx="1" fill="currentColor" />
    <rect x="15" y="1" width="12" height="12" rx="1" fill="currentColor" />
    <rect x="1" y="15" width="12" height="12" rx="1" fill="currentColor" />
    <rect x="15" y="15" width="12" height="12" rx="1" fill="var(--cobalt)" />
  </svg>
)
