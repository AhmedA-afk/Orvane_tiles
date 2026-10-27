import { ADDRESS, BRAND, EMAIL, LANGUAGES, WHATSAPP_NUMBER } from '../data/site'
import { TLink } from '../motion/Transition'
import { Mark } from './icons'
import './Footer.css'

const YEAR = new Date().getFullYear()

export function Footer() {
  const phone = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="dealers" id="dealers">
          <div>
            <h2 className="dealers-title">Dealers in India</h2>
            <p>
              Check stock by shade and batch, download this month’s price list and place a repeat order from your
              dealer account.
            </p>
          </div>
          <div className="dealers-actions">
            <a className="btn btn-primary" href="#dealers">
              Log in to your account
            </a>
            <a className="btn footer-btn-line" href="#dealers">
              Find a dealer near you
            </a>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <TLink className="footer-logo" to="/">
              <Mark />
              {BRAND}
            </TLink>
            <address>
              {ADDRESS.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
          </div>
          <nav aria-label="Products">
            <h3>Products</h3>
            <TLink to="/collections">All collections</TLink>
            <TLink to="/collections">PGVT tiles</TLink>
            <TLink to="/collections">Porcelain slabs</TLink>
            <TLink to="/collections">Wood-look planks</TLink>
          </nav>
          <nav aria-label="Buying">
            <h3>Buying</h3>
            <TLink to="/export">Container load</TLink>
            <TLink to="/export">Shipping and documents</TLink>
            <TLink to="/quote">Get a quote</TLink>
            <TLink to="/visualizer">Visualizer</TLink>
          </nav>
          <div>
            <h3>Export desk</h3>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
              WhatsApp {phone}
            </a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <p className="footer-langs">
              {LANGUAGES.map((l) => (
                <span key={l.code} lang={l.code}>
                  {l.label}
                </span>
              ))}
            </p>
          </div>
        </div>

        <p className="footer-small">
          © {YEAR} {BRAND}. Made in Morbi, Gujarat.
          <span className="demo-mark">
            Demo site: products, figures, certifications and contact details are sample data.
          </span>
        </p>
      </div>
    </footer>
  )
}
