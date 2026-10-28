import { finishById, lineById, type FinishId, type LineId } from '../data/range'

// A line's finishes as real samples: its feature stone rendered in each one,
// under one light, so a polished face shows a mirror band, a matt one none,
// and a carved one its relief. Rendered by scripts/render-stills.mjs (finish/).

export function FinishSamples({ line }: { line: LineId }) {
  const l = lineById(line)
  return (
    <ul className="fs">
      {l.finishes.map((f: FinishId) => {
        const x = finishById(f)
        return (
          <li key={f} className="fs-item" data-rv>
            <img src={`/renders/finish/${line}--${f}.jpg`} alt={`${x.name} finish, on ${l.name}'s feature stone`} width={900} height={900} loading="lazy" />
            <h3 className="fs-name">{x.name}</h3>
            <p className="fs-meta mono">
              {x.slip} · {x.gloss} gloss units
            </p>
            <p className="fs-note muted">{x.note}</p>
          </li>
        )
      })}
    </ul>
  )
}
