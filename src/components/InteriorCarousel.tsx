import { useCallback, useEffect, useRef, useState } from 'react'
import { designById, labelOf, lineById } from '../data/range'
import type { Interior } from '../data/range/interiors'
import { TLink } from '../motion/Transition'
import { DemoNote } from './Demo'
import { InteriorImage } from './Interior'

// A film strip of rooms: one large photograph at a time, the next one peeking
// in from the right, each with its room, its house, a line on what it shows,
// and the stone it is made of, linked to that stone's configurator. It scrolls
// natively (swipe, trackpad, keys), and the arrows step a slide at a time.

export function InteriorCarousel({ shots, label, showLine = false }: { shots: Interior[]; label: string; showLine?: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)

  // the slide nearest the track's left edge is the current one
  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const read = () => {
      frame = 0
      const slides = [...el.children] as HTMLElement[]
      const left = el.getBoundingClientRect().left
      let best = 0
      let dist = Infinity
      slides.forEach((s, i) => {
        const d = Math.abs(s.getBoundingClientRect().left - left)
        if (d < dist) {
          dist = d
          best = i
        }
      })
      setAt(best)
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(read)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const go = useCallback((i: number) => {
    const el = track.current
    if (!el) return
    const n = el.children.length
    const target = el.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }, [])

  if (!shots.length) return null
  return (
    <section className="icar" aria-roledescription="carousel" aria-label={label}>
      <div
        className="icar-track"
        ref={track}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(at + 1)
          if (e.key === 'ArrowLeft') go(at - 1)
        }}
      >
        {shots.map((s, i) => {
          const d = designById(s.design)
          return (
            <figure key={s.id} className="icar-slide" aria-roledescription="slide" aria-label={`${i + 1} of ${shots.length}`}>
              <InteriorImage shot={s} sizes="(min-width: 900px) 78vw, 90vw" eager={i === 0} />
              <figcaption className="icar-cap">
                <span className="icar-no mono">
                  {String(i + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}
                </span>
                <span className="icar-where mono">
                  {s.room} · {s.house}
                  {showLine ? ` · ${lineById(s.line).name}` : ''}
                </span>
                <span className="icar-text">{s.alt}.</span>
                {d && (
                  <TLink className="icar-stone" to={`/collections/${d.id}?cw=${s.colourway}`} data-cursor="Configure">
                    {labelOf(d, s.colourway)}
                    <i aria-hidden>→</i>
                  </TLink>
                )}
              </figcaption>
            </figure>
          )
        })}
      </div>
      <div className="icar-bar">
        <DemoNote topic="imagery" />
        <div className="icar-nav">
          <span className="icar-progress" aria-hidden>
            <b style={{ transform: `scaleX(${(at + 1) / shots.length})` }} />
          </span>
          <button className="icar-btn" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous room" data-cursor="hover">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button className="icar-btn" onClick={() => go(at + 1)} disabled={at >= shots.length - 1} aria-label="Next room" data-cursor="hover">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
