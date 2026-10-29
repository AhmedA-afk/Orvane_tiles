import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { DemoNote } from '../components/Demo'
import { InteriorCarousel } from '../components/InteriorCarousel'
import { TechList } from '../components/TechList'
import { interiorsFor, interiorsIn } from '../data/range/interiors'
import { CutPlanner } from '../configurator/CutPlanner'
import { EdgeProfiles, type Edge } from '../configurator/EdgeProfiles'
import { LIGHTS, type Grout, type LightId, type Pattern, type View } from '../configurator/stage-config'
import { configLine, configSpec, printConfig } from '../configurator/spec'
import { designById, designsIn, finishById, formatById, formatLabel, lineById, optionsFor, tileUrl, type FinishId, type Format, type RangeDesign } from '../data/range'
import { WHATSAPP_NUMBER } from '../data/site'
import { defaultConfig, MAX_SAMPLES, useQuote, type SampleConfig } from '../lib/quote'
import { TLink } from '../motion/Transition'
import { encodeLay, layFor } from '../studio/state'
import { groutFor } from '../three/pattern'
import { windowFor } from '../three/surface'
import NotFound from './NotFound'
import './design.css'

const ProductStage = lazy(() => import('../configurator/ProductStage'))

// One design, configured live: colourway, format, thickness and finish on the
// right; on the left the slab itself, at scale, bookmatched, laid as a floor
// or beside another finish. Below: its printed faces, its technologies, cut to
// size, edges, the full specification and the rest of its line. Every choice
// is in the URL, so a configured slab can be shared as a link.

const VIEWS: { id: View; label: string }[] = [
  { id: 'slab', label: 'Slab' },
  { id: 'scale', label: 'At scale' },
  { id: 'pair', label: 'Bookmatch' },
  { id: 'laid', label: 'Laid' },
  { id: 'compare', label: 'Compare' },
]

const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'offset', label: 'Half offset' },
  { id: 'herringbone', label: 'Herringbone' },
  { id: 'chevron', label: 'Chevron' },
]

export default function DesignPage() {
  const { id = '' } = useParams()
  const d = designById(id)
  return d ? <Design key={d.id} id={d.id} /> : <NotFound />
}

function Design({ id }: { id: string }) {
  const d = designById(id)!
  const line = lineById(d.line)
  const opts = optionsFor(d)
  const [params, setParams] = useSearchParams()
  const base = defaultConfig(d)
  const cfg: SampleConfig = {
    design: d.id,
    colourway: opts.colourways.some((c) => c.slug === params.get('cw')) ? params.get('cw')! : base.colourway,
    format: opts.formats.some((f) => f.id === params.get('format')) ? params.get('format')! : base.format,
    thickness: opts.thicknesses.some((t) => String(t.mm) === params.get('mm')) ? Number(params.get('mm')) : base.thickness,
    finish: opts.finishes.some((f) => f.id === params.get('finish')) ? (params.get('finish') as FinishId) : base.finish,
  }
  const set = (patch: Partial<SampleConfig>) => {
    const next = { ...cfg, ...patch }
    const q = new URLSearchParams(params)
    q.set('cw', next.colourway)
    q.set('format', next.format)
    q.set('mm', String(next.thickness))
    q.set('finish', next.finish)
    setParams(q, { replace: true, preventScrollReset: true })
  }

  const format = formatById(cfg.format)!
  const fit = useMemo(() => opts.formats.reduce((a, f) => (f.w * f.h > a.w * a.h ? f : a)), [opts.formats])
  const [view, setView] = useState<View>('slab')
  const [light, setLight] = useState<LightId>('day')
  const [raking, setRaking] = useState(false)
  const [edgeOn, setEdgeOn] = useState(false)
  const [face, setFace] = useState(0)
  const [pattern, setPattern] = useState<Pattern>('straight')
  const [match, setMatch] = useState<2 | 4>(2)
  const glossy = cfg.finish === 'specchio' || cfg.finish === 'glossy'
  const other = line.finishes.find((f) => (glossy ? f !== 'specchio' && f !== 'glossy' : f === 'glossy' || f === 'specchio')) ?? line.finishes.find((f) => f !== cfg.finish) ?? cfg.finish
  const [compareTo, setCompareTo] = useState<FinishId>(other)
  const compare = compareTo === cfg.finish ? other : compareTo
  const [edge, setEdge] = useState<Edge>(d.line === 'cucina' ? 'apron60' : 'eased')

  const plank = format.kind === 'plank'
  const patterns = PATTERNS.filter((p) => p.id === 'straight' || (p.id === 'offset' && format.w !== format.h) || ((p.id === 'herringbone' || p.id === 'chevron') && (plank || (format.h / format.w >= 2 && format.h <= 1200))))
  const pat = patterns.some((p) => p.id === pattern) ? pattern : 'straight'
  const slabFormat = format.kind === 'slab' || format.kind === 'xxl'
  const counters = d.line === 'cucina' || cfg.thickness >= 12

  const { cw, s, sku, sections } = configSpec(d, cfg, counters ? edge : undefined)
  // the grout follows the stone: dark joints for dark stones, pale for pale ones
  const grout: Grout = {
    tone: groutFor(cw.family),
    mm: 2,
  }
  const { add, hasExact, full } = useQuote()
  const inBox = hasExact(cfg)
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Orvane, I'd like a price for ${configLine(d, cfg, counters ? edge : undefined)} (code ${sku}).`)}`
  const more = designsIn(d.line).filter((x) => x.id !== d.id)
  const own = interiorsFor(d.id)
  const rooms = own.length ? own : interiorsIn(d.line).slice(0, 4)

  // the navigation reads light-on-dark while a dark stage is under it
  const stage = useRef<HTMLDivElement>(null)
  const [under, setUnder] = useState(true)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setUnder(e.isIntersecting), { rootMargin: '-4% 0px -94% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const html = document.documentElement
    html.dataset.tone = under && light !== 'day' ? 'dark' : 'light'
    return () => {
      delete html.dataset.tone
    }
  }, [under, light])

  // on a phone, once its actions have scrolled away, the sample stays a thumb away
  const actions = useRef<HTMLDivElement>(null)
  const [dock, setDock] = useState(false)
  useEffect(() => {
    const on = () => {
      const a = actions.current?.getBoundingClientRect()
      const f = document.querySelector('.foot')?.getBoundingClientRect()
      setDock(!!a && a.bottom < 0 && (!f || f.top > window.innerHeight))
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div className="dp">
      <section className="dp-top" aria-labelledby="dp-title">
        <div ref={stage} className="dp-stage" style={{ background: LIGHTS[light].bg }} data-tone={light === 'day' ? undefined : 'dark'}>
          <Suspense fallback={<img className="dp-poster" src={`/renders/range/${d.id}--${cw.slug}.jpg`} alt="" />}>
            <ProductStage
              design={d}
              colourway={cw}
              format={format}
              mm={cfg.thickness}
              finish={cfg.finish}
              view={view}
              light={light}
              raking={raking}
              face={face}
              edge={edgeOn && view === 'slab'}
              pattern={pat}
              grout={grout}
              match={match}
              compare={compare}
              fit={fit}
            />
          </Suspense>

          <div className="dp-bar dp-bar-top">
            <Seg label="View" value={view} options={VIEWS} onChange={setView} id="view" />
          </div>
          <div className="dp-bar dp-bar-bottom">
            <Seg
              label="Light"
              value={light}
              options={[
                { id: 'day', label: 'Daylight' },
                { id: 'evening', label: 'Evening' },
                { id: 'showroom', label: 'Showroom' },
              ]}
              onChange={setLight}
              id="light"
            />
            <button className="dp-toggle" aria-pressed={raking} onClick={() => setRaking(!raking)} data-cursor="hover">
              Raking light
            </button>
            {view === 'slab' && (
              <button className="dp-toggle" aria-pressed={edgeOn} onClick={() => setEdgeOn(!edgeOn)} data-cursor="hover">
                Show edge
              </button>
            )}
            {view === 'pair' && (
              <Seg
                label="Match"
                value={String(match)}
                options={[
                  { id: '2', label: '2-way' },
                  { id: '4', label: '4-way' },
                ]}
                onChange={(v) => setMatch(v === '4' ? 4 : 2)}
                id="match"
              />
            )}
            {view === 'laid' && (
              <>
                <Seg label="Pattern" value={pat} options={patterns} onChange={setPattern} id="pattern" />
              </>
            )}
            {view === 'compare' && (
              <Seg
                label="Against"
                value={compare}
                options={line.finishes.filter((f) => f !== cfg.finish).map((f) => ({ id: f, label: finishById(f).name }))}
                onChange={setCompareTo}
                id="against"
              />
            )}
          </div>
        </div>

        <div className="dp-panel">
          <p className="dp-crumbs mono">
            <TLink to="/collections" className="u">
              Collection
            </TLink>
            <span aria-hidden>/</span>
            <TLink to={`/lines/${line.id}`} className="u">
              {line.name}
            </TLink>
          </p>
          <h1 id="dp-title" className="dp-name">
            {d.name}
          </h1>
          <p className="dp-note">{d.note}.</p>

          <Group label="Colourway" value={cw.name}>
            <div className="dp-swatches" role="radiogroup" aria-label="Colourway">
              {opts.colourways.map((c) => (
                <button
                  key={c.slug}
                  role="radio"
                  aria-checked={c.slug === cw.slug}
                  aria-label={`${c.name}, ${c.family}`}
                  title={c.name}
                  onClick={() => set({ colourway: c.slug })}
                  style={{ backgroundImage: `url(/tiles/${c.sm})` }}
                  data-cursor="hover"
                />
              ))}
            </div>
          </Group>

          <Group label="Format" value={`${formatLabel(format)} mm`}>
            <div className="chips" role="radiogroup" aria-label="Format">
              {opts.formats.map((f) => (
                <button key={f.id} role="radio" aria-checked={f.id === format.id} onClick={() => set({ format: f.id })}>
                  {formatLabel(f)}
                </button>
              ))}
            </div>
            <FormatScale formats={opts.formats} current={format} />
            {format.demo && <DemoNote topic="sizes" />}
          </Group>

          <Group label="Thickness" value={`${cfg.thickness} mm`}>
            <Seg
              label="Thickness"
              value={String(cfg.thickness)}
              options={opts.thicknesses.map((t) => ({ id: String(t.mm), label: t.label }))}
              onChange={(mm) => set({ thickness: Number(mm) })}
              id="mm"
              wide
            />
            <p className="dp-hint">For {s.uses.join(', ').toLowerCase()}.</p>
          </Group>

          <Group label="Finish" value={finishById(cfg.finish).name}>
            <Seg
              label="Finish"
              value={cfg.finish}
              options={opts.finishes.map((f) => ({ id: f.id, label: f.name }))}
              onChange={(f) => set({ finish: f })}
              id="finish"
              wide
            />
            <p className="dp-hint">
              {finishById(cfg.finish).note} {s.slip}, {finishById(cfg.finish).gloss} gloss units.
            </p>
          </Group>

          <dl className="dp-sum">
            <div>
              <dt>Weight</dt>
              <dd>{s.kgPerM2.toFixed(1)} kg/m²</dd>
            </div>
            <div>
              <dt>Per piece</dt>
              <dd>{s.kgPerPiece.toFixed(s.kgPerPiece < 10 ? 1 : 0)} kg</dd>
            </div>
            <div>
              <dt>Per {s.packing.unit}</dt>
              <dd>
                {s.packing.pieces} · {s.packing.m2.toFixed(2)} m²
              </dd>
            </div>
            <div>
              <dt>Slip</dt>
              <dd>{s.slip}</dd>
            </div>
          </dl>
          <p className="dp-sku mono">{sku}</p>

          <div className="dp-actions" ref={actions}>
            <button className="btn btn-ink" disabled={!inBox && full} aria-pressed={inBox} onClick={() => add(cfg)} data-cursor="hover">
              {inBox ? 'In your sample box' : full ? `Sample box full (${MAX_SAMPLES})` : 'Add this sample'}
            </button>
            <TLink className="btn btn-line" to={studioLink(d, cfg)} data-cursor="hover">
              Lay it in a room
            </TLink>
            <button className="btn btn-line" onClick={() => printConfig(d, cfg, counters ? edge : undefined)} data-cursor="hover">
              Spec sheet
            </button>
            <a className="u dp-wa" href={wa} target="_blank" rel="noopener">
              Ask on WhatsApp
            </a>
          </div>
          <DemoNote topic="figures" />
        </div>
      </section>

      <div className="dp-dock" data-on={dock || undefined} inert={!dock}>
        <span className="dp-dock-face" style={{ backgroundImage: `url(${tileUrl(cw.sm)})` }} aria-hidden />
        <span className="dp-dock-text">
          <b>{d.name}</b>
          <span className="num">
            {formatLabel(format)} · {cfg.thickness} mm · {finishById(cfg.finish).name}
          </span>
        </span>
        <button className="btn btn-ink btn-sm" disabled={!inBox && full} aria-pressed={inBox} onClick={() => add(cfg)}>
          {inBox ? 'In your box' : full ? 'Box full' : 'Add sample'}
        </button>
      </div>

      {rooms.length > 0 && (
        <section className="dp-sec" aria-labelledby="rooms-title">
          <header className="dp-sec-head">
            <h2 id="rooms-title" className="title">
              {own.length ? 'In a room.' : `In ${line.name} rooms.`}
            </h2>
            <p className="muted">
              {own.length
                ? `${d.name}, laid in the houses the range is photographed in.`
                : `These rooms are from ${line.name}; open any of them to configure its stone.`}
            </p>
          </header>
          <InteriorCarousel shots={rooms} label={`Rooms with ${d.name}`} />
        </section>
      )}

      <section className="dp-sec" aria-labelledby="faces-title">
        <header className="dp-sec-head">
          <h2 id="faces-title" className="title">
            {d.faces === 1 ? 'One face, perfectly even.' : `${d.faces} faces, so no two slabs repeat.`}
          </h2>
          <p className="muted">
            Each slab in a crate is printed from a different part of the scan. Choose one to see it on the stage.
          </p>
        </header>
        <div className="dp-faces" role="radiogroup" aria-label="Face">
          {Array.from({ length: Math.min(8, d.faces) }, (_, i) => (
            <FaceThumb key={i} design={d} i={i} on={i === face} onPick={() => setFace(i)} image={`/tiles/${cw.file}`} format={format} />
          ))}
        </div>
      </section>

      {s.techs.length > 0 && (
        <section className="dp-sec" aria-labelledby="tech-title">
          <header className="dp-sec-head">
            <h2 id="tech-title" className="title">
              What goes into it.
            </h2>
          </header>
          <TechList techs={s.techs} />
        </section>
      )}

      {slabFormat && (
        <section className="dp-sec" aria-labelledby="cut-title">
          <header className="dp-sec-head">
            <h2 id="cut-title" className="title">
              Cut to size.
            </h2>
            <p className="muted">Enter the pieces a job needs; we nest them on one {formatLabel(format)} mm slab, allowing for the saw.</p>
          </header>
          <CutPlanner slab={format} image={`/tiles/${cw.sm}`} />
        </section>
      )}

      {counters && (
        <section className="dp-sec" aria-labelledby="edge-title">
          <header className="dp-sec-head">
            <h2 id="edge-title" className="title">
              Edges.
            </h2>
            <p className="muted">For counters, vanities and tables in {cfg.thickness} mm.</p>
          </header>
          <EdgeProfiles value={edge} onChange={setEdge} mm={cfg.thickness} />
        </section>
      )}

      <section className="dp-sec" aria-labelledby="spec-title">
        <header className="dp-sec-head">
          <h2 id="spec-title" className="title">
            Specification.
          </h2>
          <DemoNote topic="figures" />
        </header>
        <div className="dp-spec">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h3 className="mono muted">{sec.title}</h3>
              <dl>
                {sec.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>

      {more.length > 0 && (
        <section className="dp-sec" aria-labelledby="more-title">
          <header className="dp-sec-head">
            <h2 id="more-title" className="title">
              More from {line.name}.
            </h2>
            <TLink to={`/lines/${line.id}`} className="btn btn-line btn-sm btn-arrow" data-cursor="hover">
              The whole line
            </TLink>
          </header>
          <ul className="dp-more">
            {more.slice(0, 4).map((x) => (
              <li key={x.id}>
                <TLink to={`/collections/${x.id}`} data-cursor="Open">
                  <img src={`/renders/range/${x.id}--${x.colourways[0].slug}.jpg`} alt="" width={720} height={960} loading="lazy" />
                  <span>{x.name}</span>
                </TLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Group({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="dp-group">
      <p className="dp-group-head">
        <span className="mono muted">{label}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </p>
      {children}
    </div>
  )
}

/** a segmented control with a sliding thumb */
function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
  id,
  wide = false,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  id: string
  wide?: boolean
}) {
  return (
    <div className={`seg${wide ? ' seg-wide' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)} data-cursor="hover">
          {o.id === value && <motion.span className="seg-thumb" layoutId={`dp-${id}`} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** the line's formats drawn to scale side by side, the chosen one in ink */
function FormatScale({ formats, current }: { formats: Format[]; current: Format }) {
  const maxH = Math.max(...formats.map((f) => f.h))
  const k = 64 / maxH
  return (
    <div className="dp-fscale" aria-hidden>
      {formats.map((f) => (
        <i key={f.id} className={f.id === current.id ? 'is-on' : ''} style={{ width: f.w * k, height: f.h * k }} />
      ))}
    </div>
  )
}

/** the Studio's living room with this configuration laid where it belongs: outdoor stones on the terrace, matched onyx on the wall */
function studioLink(d: RangeDesign, c: SampleConfig) {
  const [surface, kind] = d.line === 'aperto' ? (['terrace', 'outdoor'] as const) : d.line === 'gemelli' ? (['wall', 'wall'] as const) : (['floor', 'floor'] as const)
  return `/studio?room=living&${surface}=${encodeLay(layFor(d, kind, { colourway: c.colourway, format: c.format, finish: c.finish }))}`
}

/** one printed face: the window of the stone that slab number i shows */
function FaceThumb({
  design,
  i,
  on,
  onPick,
  image,
  format,
}: {
  design: RangeDesign
  i: number
  on: boolean
  onPick: () => void
  image: string
  format: Format
}) {
  const { uv, flip } = windowFor(design, format, i)
  const [ru, rv] = uv.repeat
  const [ou, ov] = uv.offset
  const style = {
    backgroundImage: `url(${image})`,
    backgroundSize: `${100 / ru}% ${100 / rv}%`,
    backgroundPosition: `${ru < 1 ? (ou / (1 - ru)) * 100 : 50}% ${rv < 1 ? ((1 - ov - rv) / (1 - rv)) * 100 : 50}%`,
    transform: `scale(${flip[0] ? -1 : 1}, ${flip[1] ? -1 : 1})`,
    aspectRatio: `${format.w} / ${format.h}`,
  }
  return (
    <button role="radio" aria-checked={on} aria-label={`Face ${i + 1}`} onClick={onPick} className="dp-face" data-cursor="hover">
      <span style={style} />
      <b className="mono">{String(i + 1).padStart(2, '0')}</b>
    </button>
  )
}
