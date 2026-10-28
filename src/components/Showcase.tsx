import type { ReactNode } from 'react'
import { INTERIORS, type Interior } from '../data/range/interiors'
import type { DemoTopic } from '../data/demo'
import { TLink } from '../motion/Transition'
import { DemoNote } from './Demo'
import { InteriorImage } from './Interior'
import { InteriorCarousel } from './InteriorCarousel'

// Parts the showcase pages share: a room photograph with one figure set on its
// edge like a film title, a section of rooms, and the close, where the page's
// object comes back once beside its one action.

export const shot = (id: string) => INTERIORS.find((i) => i.id === id)!

/** a full-bleed room with one figure on its lower edge, and its supporting figures below */
export function PhotoFigure({
  id,
  room,
  heading,
  figure,
  unit,
  say,
  more = [],
  demo,
}: {
  id: string
  room: Interior
  heading: string
  figure: string
  unit?: string
  say: string
  more?: [string, string][]
  demo?: DemoTopic
}) {
  return (
    <section className="sh-photo" aria-labelledby={id} data-zone="dark">
      <div className="sh-photo-frame">
        <InteriorImage shot={room} sizes="100vw" className="sh-photo-img" />
        <h2 id={id} className="sh-photo-head">
          {heading}
        </h2>
        <p className="sh-photo-fig num" data-rv>
          {figure}
          {unit && <small>{unit}</small>}
        </p>
        <p className="sh-photo-say" data-rv>
          {say}
        </p>
      </div>
      {(more.length > 0 || demo) && (
        <div className="sh-photo-more">
          {more.map(([n, t]) => (
            <p key={t} data-rv>
              <b className="num">{n}</b>
              <span>{t}</span>
            </p>
          ))}
          {demo && <DemoNote topic={demo} />}
        </div>
      )}
    </section>
  )
}

/** a heading and a carousel of rooms */
export function RoomsSection({ id, title, shots, showLine = false }: { id: string; title: string; shots: Interior[]; showLine?: boolean }) {
  if (!shots.length) return null
  return (
    <section className="sh-rooms" aria-labelledby={id}>
      <h2 id={id} className="head sh-rooms-title" data-rv>
        {title}
      </h2>
      <InteriorCarousel shots={shots} label={title} showLine={showLine} />
    </section>
  )
}

/** the close: the object again, from another angle, beside one line and one action */
export function Close({
  id,
  title,
  say,
  fact,
  image,
  alt,
  actions,
}: {
  id: string
  title: string
  say: string
  fact: string
  image: ReactNode
  alt?: string
  actions: { to: string; label: string }[]
}) {
  return (
    <section className="sh-close" aria-labelledby={id}>
      <div className="sh-close-obj" aria-hidden={!alt}>
        {image}
      </div>
      <div className="sh-close-text">
        <h2 id={id} className="title" data-rv>
          {title}
        </h2>
        <p data-rv>{say}</p>
        <p className="sh-close-fact" data-rv>
          {fact}
        </p>
        <div className="sh-close-actions" data-rv>
          {actions.map((a, i) => (
            <TLink key={a.to} to={a.to} className={i === 0 ? 'btn btn-ink btn-arrow' : 'btn btn-line'} data-cursor="hover">
              {a.label}
            </TLink>
          ))}
        </div>
      </div>
    </section>
  )
}
