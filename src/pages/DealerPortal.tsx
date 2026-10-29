import { useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { DemoNote } from '../components/Demo'
import { cart, routed, shopOf } from '../dealers/state'
import { TEAM } from '../dealers/data'
import { Leads } from '../dealers/Leads'
import { Marketing } from '../dealers/Marketing'
import { Overview } from '../dealers/Overview'
import { Stock } from '../dealers/Stock'
import { ShowroomVisualizer } from '../dealers/ShowroomVisualizer'
import { Assistant } from '../dealers/Assistant'
import { useDealer } from '../studio/project'
import { TLink } from '../motion/Transition'
import './dealers.css'

// The dealer portal: what a manufacturer gives its dealers so they sell more
// of its tiles and call its sales team less. Stock by batch and shade with
// ordering from a phone, the showroom visualizer, a marketing kit in the
// dealer's own name each season, new dealers and export buyers, and an
// assistant that answers enquiries on WhatsApp and routes the leads. All of
// it runs on sample data and keeps what the visitor does on their device.

export const PORTAL = [
  { to: '/dealers', name: 'Overview', end: true },
  { to: '/dealers/visualizer', name: 'Showroom visualizer' },
  { to: '/dealers/marketing', name: 'Marketing kit' },
  { to: '/dealers/stock', name: 'Stock and orders' },
  { to: '/dealers/whatsapp', name: 'WhatsApp assistant' },
  { to: '/dealers/leads', name: 'New dealers and buyers' },
]

export default function DealerPortal() {
  const { pathname } = useLocation()
  const [dealer, setDealer] = useDealer()
  const [items] = cart.use()
  const [leads] = routed.use()
  const [editing, setEditing] = useState(false)
  const shop = shopOf(dealer)
  const rep = TEAM[0]
  const main = useRef<HTMLDivElement>(null)
  const counts: Record<string, number> = {
    '/dealers/stock': items.length,
    '/dealers/whatsapp': leads.length,
  }

  return (
    <div className="dp-portal">
      <aside className="dl-side" aria-label="Dealer portal">
        <p className="dl-product">
          <svg viewBox="0 0 14 28" aria-hidden className="dl-mark">
            <rect x="0.75" y="0.75" width="12.5" height="26.5" rx="1" />
          </svg>
          Orvane for dealers
        </p>
        <div className="dl-shop">
          <span className="dl-avatar" aria-hidden>
            {shop.name.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <b>{shop.name}</b>
            <span>{shop.city}</span>
          </span>
          <button className="dl-edit" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
        {editing && (
          <div className="dl-shop-form">
            {(
              [
                ['showroom', 'Shop name', 'Your Tile Showroom'],
                ['city', 'City', 'Pune'],
                ['phone', 'Phone', '+91 00000 00000'],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={k}>
                <span>{label}</span>
                <input value={dealer[k]} placeholder={ph} maxLength={48} onChange={(e) => setDealer({ ...dealer, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        )}
        <nav className="dl-nav">
          {PORTAL.map((p) => {
            const on = p.end ? pathname === p.to : pathname.startsWith(p.to)
            return (
              <TLink key={p.to} to={p.to} aria-current={on ? 'page' : undefined} onClick={() => main.current?.scrollIntoView()}>
                <span>{p.name}</span>
                {counts[p.to] ? <b className="num">{counts[p.to]}</b> : null}
              </TLink>
            )
          })}
        </nav>
        <div className="dl-rep">
          <span className="dl-avatar" style={{ background: rep.tint }} aria-hidden>
            {rep.name.slice(0, 1)}
          </span>
          <span>
            <b>{rep.name}</b>
            <span>
              Your rep · {rep.covers}
            </span>
          </span>
        </div>
        <DemoNote topic="figures" />
      </aside>

      <div className="dl-main" ref={main}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="stock" element={<Stock />} />
          <Route path="visualizer" element={<ShowroomVisualizer />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="leads" element={<Leads />} />
          <Route path="whatsapp" element={<Assistant />} />
        </Routes>
      </div>
    </div>
  )
}
