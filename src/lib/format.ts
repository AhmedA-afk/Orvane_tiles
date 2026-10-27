const nf = new Intl.NumberFormat('en-US')
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export const num = (n: number) => nf.format(Math.round(n))
export const num1 = (n: number) => nf1.format(n)

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
