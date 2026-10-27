import type { CSSProperties } from 'react'

// Text split into words and letters at render time, so a CSS animation runs
// from the first paint. Letter-split text is aria-hidden (some screen readers
// spell inline-block letters out), so the heading must carry aria-label.
// Every .sp-c carries --ci (index) and --cr (index from the end); .sp-w clips
// its letters, so a letter moved out of it vanishes: the "rising from a slot"
// reveal.
export function Split({ text, by = 'char', className = '' }: { text: string; by?: 'char' | 'word'; className?: string }) {
  const words = text.split(' ')
  const total = by === 'word' ? words.length : words.join('').length
  let n = 0
  const unit = (content: string, key: number) => {
    const i = n++
    return (
      <span key={key} className="sp-c" style={{ '--ci': i, '--cr': total - 1 - i } as CSSProperties}>
        {content}
      </span>
    )
  }
  return (
    <span className={className} aria-hidden={by === 'word' ? undefined : true}>
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="sp-w">{by === 'word' ? unit(w, 0) : [...w].map((ch, ci) => unit(ch, ci))}</span>
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  )
}
