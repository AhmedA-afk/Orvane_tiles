import { useRef } from 'react'
import { DemoNote } from '../components/Demo'
import files from '../data/downloads.json' with { type: 'json' }
import { useReveal } from '../motion/useReveal'
import './downloads.css'

// The downloads: the collection catalogue, a brochure for each line, the
// technical data, the price list and the guides, as PDFs made in Orvane's own
// look by scripts/make-pdfs.mjs from the range's data and pictures.

export interface Download {
  file: string
  thumb: string
  title: string
  kind: string
  about: string
  line?: string
  pages: number
  bytes: number
}

export const DOWNLOADS = files as Download[]
const FILES = DOWNLOADS
const mb = (b: number) => `${(b / 1e6).toFixed(1)} MB`
const href = (f: Download) => `/downloads/${f.file}`

export default function Downloads() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const catalogue = FILES.find((f) => f.kind === 'Catalogue')
  const brochures = FILES.filter((f) => f.kind === 'Line brochure')
  const rest = FILES.filter((f) => f.kind !== 'Catalogue' && f.kind !== 'Line brochure')

  return (
    <div className="dw" ref={root}>
      <header className="dw-head">
        <h1 className="dw-title o-lines" data-rv>
          <span>
            <span>Downloads.</span>
          </span>
        </h1>
        <p className="lead" data-rv>
          The collection, a brochure for every line, the technical data, the price list and the guides, as PDFs to keep, print or send on.
        </p>
      </header>

      {catalogue && (
        <section className="dw-hero" aria-labelledby="dw-cat">
          <a className="dw-cover" href={href(catalogue)} target="_blank" rel="noopener" data-cursor="Open" data-rv>
            <img src={`/downloads/${catalogue.thumb}`} alt={`The cover of ${catalogue.title}`} width={953} height={1348} />
          </a>
          <div className="dw-hero-text" data-rv>
            <p className="dw-kind">{catalogue.kind}</p>
            <h2 id="dw-cat" className="head">
              {catalogue.title}
            </h2>
            <p className="lead">{catalogue.about}</p>
            <p className="dw-meta num">
              {catalogue.pages} pages · PDF · {mb(catalogue.bytes)}
            </p>
            <div className="dw-actions">
              <a className="btn btn-ink btn-arrow" href={href(catalogue)} download data-cursor="hover">
                Download the catalogue
              </a>
              <a className="btn btn-line" href={href(catalogue)} target="_blank" rel="noopener" data-cursor="hover">
                Open it
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="dw-sec" aria-labelledby="dw-lines">
        <h2 id="dw-lines" className="title" data-rv>
          A brochure for every line.
        </h2>
        <ul className="dw-grid">
          {brochures.map((f) => (
            <li key={f.file} data-rv>
              <a href={href(f)} download data-cursor="Download">
                <img src={`/downloads/${f.thumb}`} alt="" width={953} height={1348} loading="lazy" />
                <b>{f.title}</b>
                <span className="num">
                  {f.pages} pages · {mb(f.bytes)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="dw-sec" aria-labelledby="dw-rest">
        <h2 id="dw-rest" className="title" data-rv>
          Data, prices and guides.
        </h2>
        <ul className="dw-list">
          {rest.map((f) => (
            <li key={f.file} data-rv>
              <img src={`/downloads/${f.thumb}`} alt="" width={953} height={1348} loading="lazy" />
              <span className="dw-list-text">
                <span className="dw-kind">{f.kind}</span>
                <b>{f.title}</b>
                <span>{f.about}</span>
              </span>
              <span className="dw-meta num">
                {f.pages} {f.pages === 1 ? 'page' : 'pages'} · {mb(f.bytes)}
              </span>
              <a className="btn btn-line btn-sm" href={href(f)} download data-cursor="hover">
                Download
              </a>
            </li>
          ))}
        </ul>
        <DemoNote topic="company" />
      </section>
    </div>
  )
}
