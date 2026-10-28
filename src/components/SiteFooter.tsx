import { useEffect, useState } from 'react'
import { ADDRESS, EMAIL, WHATSAPP_NUMBER } from '../data/site'
import { TLink } from '../motion/Transition'
import { NAV_LINKS } from './Nav'

// The close of every page: columns of plain links, the studio's live time and
// coordinates, and the name set across the full width.

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
      <div className="foot-cols">
        <div className="foot-lead">
          <p className="foot-say">Porcelain that reads as stone, pressed and fired in Morbi.</p>
          <TLink className="btn btn-ink" to="/quote" data-cursor="hover">
            Order a sample box
          </TLink>
        </div>
        <nav aria-label="Site">
          <p className="mono">Site</p>
          {NAV_LINKS.map((l) => (
            <TLink key={l.to} className="u" to={l.to}>
              {l.label}
            </TLink>
          ))}
          <TLink className="u" to="/studio">
            Studio
          </TLink>
          <TLink className="u" to="/quote">
            Sample box
          </TLink>
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
