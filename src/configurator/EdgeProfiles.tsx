// Edge profiles for counters, vanities and tables, drawn as true sections of
// the chosen thickness. A mitred apron joins a second strip at 45° so a thin
// slab reads as a solid block of stone.

export type Edge = 'square' | 'eased' | 'bevel' | 'half' | 'bullnose' | 'apron40' | 'apron60' | 'apron100'

export const EDGES: { id: Edge; name: string; note: string }[] = [
  { id: 'square', name: 'Square', note: 'A crisp, square arris.' },
  { id: 'eased', name: 'Eased', note: 'Square, with the sharpness taken off.' },
  { id: 'bevel', name: 'Bevel', note: 'A 5 mm chamfer that catches a line of light.' },
  { id: 'half', name: 'Half bullnose', note: 'The top edge rounded into the face.' },
  { id: 'bullnose', name: 'Bullnose', note: 'A full round edge, soft to lean on.' },
  { id: 'apron40', name: 'Mitred 40', note: 'A 45° mitre to a 40 mm apron: reads as solid stone.' },
  { id: 'apron60', name: 'Mitred 60', note: 'A 45° mitre to a 60 mm apron: reads as solid stone.' },
  { id: 'apron100', name: 'Mitred 100', note: 'A 45° mitre to a 100 mm apron, for an island that looks carved.' },
]

const L = 70 // mm of counter shown

function shapes(edge: Edge, t: number): string[] {
  switch (edge) {
    case 'eased':
      return [`M0 0 H${L - 2} Q${L} 0 ${L} 2 V${t - 2} Q${L} ${t} ${L - 2} ${t} H0 Z`]
    case 'bevel':
      return [`M0 0 H${L - 5} L${L} 5 V${t} H0 Z`]
    case 'half':
      return [`M0 0 H${L - t} A${t} ${t} 0 0 1 ${L} ${t} H0 Z`]
    case 'bullnose':
      return [`M0 0 H${L - t / 2} A${t / 2} ${t / 2} 0 0 1 ${L - t / 2} ${t} H0 Z`]
    case 'apron40':
    case 'apron60':
    case 'apron100': {
      const a = Number(edge.slice(5))
      return [`M0 0 H${L} L${L - t} ${t} H0 Z`, `M${L} 0 V${a} H${L - t} V${t} Z`]
    }
    default:
      return [`M0 0 H${L} V${t} H0 Z`]
  }
}

function Section({ edge, t, big = false }: { edge: Edge; t: number; big?: boolean }) {
  const deep = edge.startsWith('apron') ? Number(edge.slice(5)) : t
  // the large drawing closes in on the edge itself
  const box = big ? `${L - 46} -10 66 ${deep + 22}` : `-6 -14 ${L + 20} 110`
  return (
    <svg viewBox={box} className={big ? 'edge-big' : 'edge-svg'} aria-hidden>
      {shapes(edge, t).map((d, i) => (
        <path key={i} d={d} className="edge-stone" />
      ))}
      {big && (
        <>
          <line x1={L + 8} y1={0} x2={L + 8} y2={t} className="edge-dim" />
          <text x={L + 10} y={t / 2} className="edge-text" dominantBaseline="middle">
            {t} mm
          </text>
        </>
      )}
    </svg>
  )
}

export function EdgeProfiles({ value, onChange, mm }: { value: Edge; onChange: (e: Edge) => void; mm: number }) {
  const current = EDGES.find((e) => e.id === value)!
  return (
    <div className="edges">
      <div className="edges-pick" role="radiogroup" aria-label="Edge profile">
        {EDGES.map((e) => (
          <button key={e.id} role="radio" aria-checked={e.id === value} onClick={() => onChange(e.id)} data-cursor="hover">
            <Section edge={e.id} t={mm} />
            <span>{e.name}</span>
          </button>
        ))}
      </div>
      <figure className="edges-now">
        <Section edge={value} t={mm} big />
        <figcaption>
          <b>{current.name}</b> on {mm} mm. {current.note}
        </figcaption>
      </figure>
    </div>
  )
}
