import { useEffect, useState } from 'react'
import { designById, LINES, tileUrl } from '../data/range'
import { ADDRESS, EMAIL, WHATSAPP_NUMBER } from '../data/site'
import { TLink } from '../motion/Transition'
import { NAV_LINKS } from './Nav'

// The close of every page: the sample box asked for beside a rack of the eight
// lines, each its own stone; then columns of plain links, the studio's live
// time and coordinates, and the name set across the full width.

const RACK = LINES.map((l) => {
  const d = designById(l.feature)
  return { id: l.id, name: l.name, face: d ? tileUrl(d.colourways[0].sm) : '' }
})

const YEAR = new Date().getFullYear()

function useMorbiTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15_000)
    return () => clearInterval(id)
  }, [])
  return t
}

export function SiteFooter() {
  const time = useMorbiTime()
  const phone = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-lead">
          <p className="foot-say">Porcelain that reads as stone, pressed and fired in Morbi.</p>
          <div className="foot-acts">
            <TLink className="btn btn-ink btn-arrow" to="/quote" data-cursor="hover">
              Order a sample box
            </TLink>
            <TLink className="btn btn-line" to="/downloads" data-cursor="hover">
              The catalogue, PDF
            </TLink>
          </div>
        </div>
        <ul className="foot-rack" aria-label="The eight lines">
          {RACK.map((l) => (
            <li key={l.id}>
              <TLink to={`/lines/${l.id}`} data-cursor="Open">
                <span className="foot-face" style={{ backgroundImage: `url(${l.face})` }} />
                <span className="foot-line">{l.name}</span>
              </TLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="foot-cols">
        <nav aria-label="Site">
          <p className="mono">Site</p>
          <div className="foot-links">
            {NAV_LINKS.map((l) => (
              <TLink key={l.to} className="u" to={l.to}>
                {l.label}
              </TLink>
            ))}
            <TLink className="u" to="/dealers">
              Dealer portal
            </TLink>
            <TLink className="u" to="/downloads">
              Downloads
            </TLink>
            <TLink className="u" to="/quote">
              Sample box
            </TLink>
          </div>
        </nav>
        <div>
          <p className="mono">Studio</p>
          <a className="u" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
            WhatsApp {phone}
          </a>
          <a className="u" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <address>
            {ADDRESS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </address>
        </div>
        <div>
          <p className="mono">Morbi</p>
          <span>22.82° N, 70.84° E</span>
          <span>{time} IST</span>
        </div>
      </div>
      <p className="foot-word" aria-hidden>
        Orvane
      </p>
      <div className="foot-base">
        <span>© {YEAR} Orvane Ceramica · a demo company</span>
        <span className="foot-credit">
          Every product, figure and contact here is sample data. Slabs rendered from ambientCG scans (CC0); furniture
          models from Poly Haven (CC0). Photographs via Wikimedia Commons: Mani Mandir by Nitish.mano and Mundra port by
          Vijay8808 (CC BY-SA 4.0), the port of Mundra by Felix Dance (CC BY 2.0); terminal footage by the USDA (public
          domain).
        </span>
      </div>
    </footer>
  )
}
