import { useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Quote, type Ask } from '../components/Quote'
import { useReveal } from '../motion/useReveal'

export default function QuotePage() {
  const [params] = useSearchParams()
  const ask = (['samples', 'price', 'visit'] as Ask[]).find((a) => a === params.get('for')) ?? 'samples'
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  return (
    <div className="quote-page" ref={root}>
      <header className="quote-head">
        <p className="kicker mono" data-rv>
          <span>Sample box</span>
          <span>Container price</span>
          <span>Factory visit</span>
        </p>
        <h1 className="quote-title o-lines" data-rv>
          <span>
            <span>Write to</span>
          </span>
          <span>
            <span>Morbi.</span>
          </span>
        </h1>
        <p className="lead" data-rv>
          Choose the designs and tell us where. Your message is written as you go and opens in WhatsApp, ready to send
          to the studio.
        </p>
      </header>
      <Quote key={ask} ask={ask} />
    </div>
  )
}
