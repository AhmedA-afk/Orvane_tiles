import { PRODUCTS } from '../data/catalog'
import { TLink } from '../motion/Transition'

// A lost visitor still lands in the showroom: the page says what happened in
// one line and offers four designs to step back in through.

const PICKS = ['statuario', 'nero', 'onice', 'travertino'].map((d) => PRODUCTS.find((p) => p.design === d)!)

export default function NotFound() {
  return (
    <section className="nf" aria-labelledby="nf-title">
      <p className="kicker mono">
        <span>404</span>
        <span>Page not found</span>
      </p>
      <h1 id="nf-title" className="nf-title">
        Not on the rack.
      </h1>
      <div className="nf-foot">
        <p className="lead">The link may be old, or the design has moved. The whole collection is one step away.</p>
        <TLink className="btn btn-ink btn-arrow" to="/collections" data-cursor="hover">
          See the collection
        </TLink>
      </div>
      <ul className="nf-picks">
        {PICKS.map((p) => (
          <li key={p.id}>
            <TLink to={`/collections?design=${p.design}`} data-cursor="Open">
              <img src={`/renders/card-${p.design}.jpg`} alt="" width={720} height={960} loading="lazy" />
              <span>{p.name}</span>
            </TLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
