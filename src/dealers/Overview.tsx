import { useMemo } from 'react'
import { InteriorImage } from '../components/Interior'
import { shot } from '../components/Showcase'
import { designById, labelOf } from '../data/range'
import { TLink } from '../motion/Transition'
import { useDealer } from '../studio/project'
import { batchesOf, lineFigures, PAST_ORDERS, personById, SEASONS, STOCKED } from './data'
import { placed, routed, shopOf } from './state'

// The portal's first screen answers one question: what needs the dealer
// today. The order on the road, the enquiries answered for them, this
// season's kit, what is running low on their shelf; then the tools, the
// two that sell the most first.

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function Overview() {
  const [dealer] = useDealer()
  const [mine] = placed.use()
  const [answered] = routed.use()
  const shop = shopOf(dealer)
  const orders = [...mine, ...PAST_ORDERS]
  const moving = orders.filter((o) => o.state !== 'Delivered')
  const season = SEASONS[0]
  // the designs on the dealer's own shelf that have run lowest at their depot
  const low = useMemo(
    () =>
      STOCKED.slice(0, 40)
        .map((d) => ({ d, b: batchesOf(d, designById(d.id)!.line === 'legno' ? '200x1200' : d.line === 'aperto' ? '600x1200' : '1200x2400') }))
        .filter((x) => x.b.length && x.b[0].depot > 0 && x.b[0].depot < 60)
        .slice(0, 3),
    [],
  )

  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">
          {greeting()}, {shop.name}.
        </h1>
        <p className="lead">
          {moving.length ? `${moving.length} ${moving.length === 1 ? 'order is' : 'orders are'} on the way` : 'Nothing on the way'}, {answered.length + 7} enquiries were
          answered for you this week, and the {season.name} kit is ready.
        </p>
      </header>

      <section className="dl-today" aria-label="Today">
        <TLink to="/dealers/stock" className="dl-tile dl-tile-ink">
          <span className="dl-tile-label">On the road</span>
          {moving[0] ? (
            <>
              <b className="num">{moving[0].no}</b>
              <span>
                {moving[0].eta} · {moving[0].lines.reduce((a, l) => a + lineFigures(l).m2, 0).toFixed(0)} m²
              </span>
            </>
          ) : (
            <b>All delivered</b>
          )}
        </TLink>
        <TLink to="/dealers/whatsapp" className="dl-tile">
          <span className="dl-tile-label">Answered for you</span>
          <b className="num">{answered.length + 7}</b>
          <span>enquiries this week, {answered.length ? `the last sent to ${personById(answered[0].to).name}` : 'each sent to the right person'}</span>
        </TLink>
        <TLink to="/dealers/marketing" className="dl-tile">
          <span className="dl-tile-label">This season’s kit</span>
          <b>{season.name}</b>
          <span>3 posts, a reel, a brochure and a WhatsApp catalogue, in your name</span>
        </TLink>
        <TLink to="/dealers/stock" className="dl-tile">
          <span className="dl-tile-label">Low on your shelf</span>
          {low.length ? (
            <>
              <b>{low.map((x) => x.d.name).join(', ')}</b>
              <span>under 60 m² at your depot</span>
            </>
          ) : (
            <b>Nothing running low</b>
          )}
        </TLink>
      </section>

      <section className="dl-feature" aria-labelledby="dl-viz">
        <TLink to="/dealers/visualizer" className="dl-feature-card">
          <span className="dl-feature-pic">
            <InteriorImage shot={shot('maesta-calacatta-living')} sizes="(min-width: 900px) 40vw, 90vw" />
          </span>
          <span className="dl-feature-text">
            <h2 id="dl-viz" className="title">
              Showroom visualizer
            </h2>
            <span>Your customer picks a stone and sees it in a photo of their own room, on your screen or their phone. They decide in the shop.</span>
            <span className="dl-go">Open it →</span>
          </span>
        </TLink>
        <TLink to="/dealers/marketing" className="dl-feature-card">
          <span className="dl-feature-pic dl-post">
            <InteriorImage shot={shot(season.rooms[0])} sizes="(min-width: 900px) 40vw, 90vw" />
            <span className="dl-post-band">
              <b>{season.headline}</b>
              <span>
                {shop.name}, {shop.city}
              </span>
            </span>
          </span>
          <span className="dl-feature-text">
            <h2 className="title">Marketing kit</h2>
            <span>Each season, posts, a reel, a brochure and a WhatsApp catalogue with your shop’s name and number on them. Ready to send.</span>
            <span className="dl-go">This season’s kit →</span>
          </span>
        </TLink>
      </section>

      <section className="dl-more" aria-label="More tools">
        {[
          ['/dealers/stock', 'Stock and orders', 'Live stock by batch and shade for every design, and orders from your phone, so the floor matches and nobody has to call.'],
          ['/dealers/whatsapp', 'WhatsApp assistant', 'Enquiries answered at once with the design, the sizes and the price list, and the lead sent to the right person.'],
          ['/dealers/leads', 'New dealers and buyers', 'Cities where the network is thin, importers abroad, and the first message to each, written for you.'],
        ].map(([to, name, say]) => (
          <TLink key={to} to={to} className="dl-more-row">
            <b>{name}</b>
            <span>{say}</span>
            <span className="dl-go">→</span>
          </TLink>
        ))}
      </section>

      {orders.length > 0 && (
        <section className="dl-recent" aria-labelledby="dl-recent-title">
          <h2 id="dl-recent-title" className="dl-h2">
            Recent orders
          </h2>
          <ul>
            {orders.slice(0, 4).map((o) => (
              <li key={o.no}>
                <span className="num">{o.no}</span>
                <span>{o.lines.map((l) => labelOf(designById(l.design)!, l.colourway)).join(', ')}</span>
                <span className="dl-state" data-state={o.state}>
                  {o.state}
                </span>
                <span className="muted">{o.eta}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
