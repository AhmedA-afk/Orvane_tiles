import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { ROUTES } from '../data/site'
import { EASE_OUT } from '../lib/format'
import './Export.css'

const MAX_DAYS = 40

export function Export() {
  const routesRef = useRef<HTMLDivElement>(null)
  const inView = useInView(routesRef, { once: true, margin: '0px 0px -15% 0px' })
  return (
    <section className="export" id="export" aria-labelledby="export-title">
      <div className="wrap export-grid">
        <div>
          <h2 className="h2" id="export-title">
            Where our containers go.
          </h2>
          <p className="lede">
            Containers leave the factory by road for Mundra, a few hours away, and reach the Gulf in under a week.
            We quote FOB Mundra or CIF to your port, with documents for customs in your country.
          </p>
          <ul className="export-docs">
            <li>Commercial invoice and packing list</li>
            <li>Certificate of origin</li>
            <li>Bill of lading</li>
            <li>Test reports on request</li>
          </ul>
        </div>

        <div className="routes" role="table" aria-label="Indicative sea transit from Mundra" ref={routesRef}>
          <div className="routes-head" role="row">
            <span role="columnheader">Port</span>
            <span role="columnheader">Days at sea from Mundra</span>
          </div>
          {ROUTES.map((r, i) => (
            <div className="route" role="row" key={r.port}>
              <span role="cell" className="route-port">
                <strong>{r.port}</strong>
                <span>{r.country}</span>
              </span>
              <span role="cell" className="route-days">
                <span className="route-track">
                  <motion.span
                    className="route-fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: inView ? r.days / MAX_DAYS : 0 }}
                    transition={{ duration: 0.9, delay: i * 0.05, ease: EASE_OUT }}
                  />
                </span>
                <span className="num route-n">{r.days}</span>
              </span>
            </div>
          ))}
          <p className="routes-note">Indicative transit times. Your quote includes the current sailing schedule.</p>
        </div>
      </div>
    </section>
  )
}
