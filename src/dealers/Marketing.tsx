import { useEffect, useMemo, useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { lineById } from '../data/range'
import { TLink } from '../motion/Transition'
import { useDealer } from '../studio/project'
import { SEASONS, type Season } from './data'
import { catalogueMessage, drawCatalogue, drawPost, drawReel, printBrochure, recordReel, reelImages, REEL_SECONDS, type Shop } from './kit'
import { shopOf } from './state'

// The marketing kit: each season, ready-made posts, a reel, a brochure and a
// WhatsApp catalogue with the dealer's own shop name and number on them, made
// on the spot. Change the name in the sidebar and every piece changes with it.

const save = (blob: Blob, name: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function Marketing() {
  const [dealer] = useDealer()
  // one shop object while the details stay the same, so the reel is not restarted on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shop = useMemo(() => shopOf(dealer), [dealer.showroom, dealer.city, dealer.phone])
  const [si, setSi] = useState(0)
  const s = SEASONS[si]
  return (
    <div className="dl-page">
      <header className="dl-head">
        <h1 className="dl-title">Marketing kit.</h1>
        <p className="lead">
          This season’s posts, reel, brochure and WhatsApp catalogue, made in the name of {shop.name}. Change your details in the sidebar
          and every piece follows.
        </p>
      </header>

      <div className="dl-tools">
        <div className="st-chips" role="radiogroup" aria-label="Season">
          {SEASONS.map((x, i) => (
            <button key={x.id} role="radio" aria-checked={i === si} onClick={() => setSi(i)}>
              {x.name}
            </button>
          ))}
        </div>
        <span className="muted dl-when">{s.when}</span>
      </div>

      <section className="dl-kit" aria-label={`${s.name} kit`}>
        <div className="dl-posts">
          {[0, 1, 2].map((i) => (
            <Post key={`${s.id}${i}`} s={s} shop={shop} layout={i} />
          ))}
        </div>
        <div className="dl-kit-side">
          <Reel s={s} shop={shop} />
          <Catalogue s={s} shop={shop} />
          <article className="dl-piece">
            <h2 className="dl-h2">Brochure</h2>
            <p>
              Four A4 pages: the season on the cover, its designs, its rooms, and your shop on the back. Print it, or save it as a PDF to
              send.
            </p>
            <div className="st-actions">
              <button className="btn btn-ink btn-sm" onClick={() => printBrochure(s, shop)} data-cursor="hover">
                Open the brochure
              </button>
              <a className="btn btn-line btn-sm" href={`/downloads/orvane-${s.line}-brochure.pdf`} download data-cursor="hover">
                {lineById(s.line).name} brochure, PDF
              </a>
            </div>
            <p className="muted">
              Every catalogue and brochure is on the{' '}
              <TLink className="u" to="/downloads">
                downloads page
              </TLink>
              .
            </p>
          </article>
        </div>
      </section>
      <DemoNote topic="imagery" />
    </div>
  )
}

function Post({ s, shop, layout }: { s: Season; shop: Shop; layout: number }) {
  const c = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!c.current) return
    setReady(false)
    drawPost(c.current, s, shop, layout).then(() => setReady(true))
  }, [s, shop.name, shop.city, shop.phone, layout])
  return (
    <figure className="dl-post-card">
      <canvas
        ref={c}
        width={1080}
        height={1080}
        role="img"
        aria-label={`A square post for ${s.name}, with ${shop.name}'s name`}
        data-ready={ready ? '' : undefined}
      />
      <figcaption>
        <span>{['Room', 'Stone', 'Collection'][layout]} post · 1080 × 1080</span>
        <button
          className="u"
          disabled={!ready}
          onClick={() => c.current?.toBlob((b) => b && save(b, `${slug(shop.name)}-${s.id}-post-${layout + 1}.png`), 'image/png')}
        >
          Download
        </button>
      </figcaption>
    </figure>
  )
}

/** the reel, playing live in its frame; recorded to a video file on request */
function Reel({ s, shop }: { s: Season; shop: Shop }) {
  const c = useRef<HTMLCanvasElement>(null)
  const [busy, setBusy] = useState<number | null>(null)
  useEffect(() => {
    let raf = 0
    let live = true
    reelImages(s).then((imgs) => {
      const g = c.current?.getContext('2d')
      if (!g || !live) return
      const t0 = performance.now()
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const frame = () => {
        const t = reduce ? 1.5 : ((performance.now() - t0) / 1000) % (REEL_SECONDS + 1)
        drawReel(g, imgs, s, shop, Math.min(t, REEL_SECONDS), 360, 640)
        if (!reduce) raf = requestAnimationFrame(frame)
      }
      frame()
    })
    return () => {
      live = false
      cancelAnimationFrame(raf)
    }
  }, [s, shop])
  return (
    <article className="dl-piece dl-reel">
      <canvas ref={c} width={360} height={640} role="img" aria-label={`A nine-second reel for ${s.name}, ending on ${shop.name}`} />
      <div>
        <h2 className="dl-h2">Reel</h2>
        <p>Nine seconds, upright, for Instagram, Facebook and WhatsApp status: two rooms, the season’s stones, and your shop to end on.</p>
        <button
          className="btn btn-ink btn-sm"
          disabled={busy !== null || typeof MediaRecorder === 'undefined'}
          onClick={async () => {
            setBusy(0)
            try {
              const { blob, ext } = await recordReel(s, shop, setBusy)
              save(blob, `${slug(shop.name)}-${s.id}-reel.${ext}`)
            } finally {
              setBusy(null)
            }
          }}
          data-cursor="hover"
        >
          {busy === null ? 'Make the video' : `Recording… ${Math.round(busy * 100)}%`}
        </button>
      </div>
    </article>
  )
}

function Catalogue({ s, shop }: { s: Season; shop: Shop }) {
  const c = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (c.current) drawCatalogue(c.current, s, shop)
  }, [s, shop])
  const text = catalogueMessage(s, shop)
  return (
    <article className="dl-piece dl-cat">
      <canvas ref={c} width={1080} height={1920} role="img" aria-label={`A WhatsApp catalogue of ${s.name}'s stones`} />
      <div>
        <h2 className="dl-h2">WhatsApp catalogue</h2>
        <p>A tall card of the season’s stones and a message to send with it, to your customer list or a broadcast.</p>
        <div className="st-actions">
          <button
            className="btn btn-ink btn-sm"
            onClick={() => c.current?.toBlob((b) => b && save(b, `${slug(shop.name)}-${s.id}-catalogue.png`), 'image/png')}
            data-cursor="hover"
          >
            Download the card
          </button>
          <button
            className="btn btn-line btn-sm"
            onClick={() =>
              navigator.clipboard?.writeText(text).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              })
            }
            data-cursor="hover"
          >
            {copied ? 'Copied' : 'Copy the message'}
          </button>
        </div>
      </div>
    </article>
  )
}
