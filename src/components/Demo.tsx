import { DEMO, type DemoTopic } from '../data/demo'

/** The disclaimer that travels with a claim: a small "Demo" tag and its note. */
export function DemoNote({ topic, className = '' }: { topic: DemoTopic; className?: string }) {
  return (
    <p className={`demo-note mono ${className}`}>
      <b>Demo</b>
      <span>{DEMO[topic]}</span>
    </p>
  )
}

/**
 * A certification shown as a typographic badge in the site's own style. It
 * names the standard but never reproduces an official mark (CE, ISI and the
 * like are protected); a manufacturer swaps in its real logos.
 */
export function CertBadge({ code, label }: { code: string; label: string }) {
  return (
    <figure className="cert">
      <span className="cert-ring mono" aria-hidden>
        Certified
      </span>
      <b className="cert-code">{code}</b>
      <figcaption className="cert-label">{label}</figcaption>
    </figure>
  )
}
