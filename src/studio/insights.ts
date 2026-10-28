// What visitors do in the Studio, counted on this device: which rooms they
// open, which stones they lay and in which finish, at what hour, and how far
// they go (a photograph, a share, a sample, a project). Nothing is sent: a
// manufacturer's own site would send these to its analytics; here the
// insights page shows them beside a month of sample figures.

const KEY = 'orvane-insights'

export type Counts = Record<string, Record<string, number>>

export function readInsights(): Counts {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Counts
  } catch {
    return {}
  }
}

export function track(event: string, key = 'all') {
  try {
    const c = readInsights()
    c[event] ??= {}
    c[event][key] = (c[event][key] ?? 0) + 1
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // private browsing or a full store: the count is simply lost
  }
}

export const clearInsights = () => localStorage.removeItem(KEY)
