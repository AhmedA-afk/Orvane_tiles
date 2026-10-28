import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { cardUrl, designById, finishById, formatById, formatLabel, labelOf, optionsFor, specFor } from '../data/range'
import { MAX_SAMPLES, useQuote } from '../lib/quote'
import { packs as packsOf } from '../data/trade'
import { TLink } from '../motion/Transition'
import {
  CUSTOM_DEFAULT,
  customRoom,
  customSurfaces,
  MOODS,
  roomById,
  ROOMS,
  SURFACE_DEFS,
  WEATHER,
  type MoodId,
  type RoomDef,
  type RoomId,
  type SurfaceDef,
  type WeatherId,
} from '../studio/rooms'
import { paintLay } from '../studio/paint'
import type { SnapshotJob } from '../studio/Snapshot'
import { decodeLay, encodeLay, layFor, PATTERN_NAME, patternsFor, sampleOf, startLay, type Lay } from '../studio/state'
import { StonePicker } from '../studio/StonePicker'
import { useOwnDesigns } from '../studio/uploads'
import { DealerPanel, ProjectDrawer, TakeHome, TradeLine } from '../studio/SalesTools'
import { useDealer, useProject } from '../studio/project'
import { track } from '../studio/insights'
import { clock, lightAt, MOMENTS, RISE, SET, weathered } from '../studio/sun'
import './studio.css'

const Scene = lazy(() => import('../studio/Scene'))

// Orvane Studio: the room is the page. Choose a room; lay any stone on any of
// its surfaces, in any of its formats, patterns and finishes; turn the dial
// through the day, cloud it over or let it rain, and set the lamps; walk
// round; and take a photograph, path traced. The whole room travels in the
// URL, so a buyer can send exactly what they laid.

const clampDim = (v: number, lo: number, hi: number) => Math.round(Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo)) * 10) / 10

const moment = (h: number) => {
  const L = lightAt(h)
  if (L.elevation < -4) return 'night'
  if (L.elevation < 10) return h < 12 ? 'dawn' : 'dusk'
  if (L.elevation < 30) return h < 12 ? 'morning' : 'golden hour'
  return h < 15 ? 'midday' : 'afternoon'
}

type Dims = [number, number, number]

const roomOf = (id: RoomId, dims: Dims) => (id === 'custom' ? customRoom(...dims) : roomById(id))
const surfacesOf = (id: RoomId, dims: Dims) => (id === 'custom' ? customSurfaces(...dims) : SURFACE_DEFS[id])

/** a room's lays: from the link where it names them, else as the room starts */
function laysFrom(surfaces: SurfaceDef[], params: URLSearchParams | null): Record<string, Lay> {
  const out: Record<string, Lay> = {}
  for (const s of surfaces) out[s.id] = (params && decodeLay(params.get(s.id), s.kind)) || startLay(s)
  // an old link to the visualizer named only a design
  const d = params?.get('design') && designById(params.get('design')!)
  if (d && !params?.get('floor')) out.floor = layFor(d, 'floor')
  return out
}

/** waits for the designs a visitor has added on this device, so a link that lays one finds it */
export default function StudioPage() {
  const { ready } = useOwnDesigns()
  return ready ? <Studio /> : <div className="st-wait" aria-busy="true" />
}

function Studio() {
  const [params, setParams] = useSearchParams()
  const [roomId, setRoomId] = useState<RoomId>(() => (params.get('room') === 'custom' ? 'custom' : roomById(params.get('room') ?? 'living').id))
  const [dims, setDims] = useState<Dims>(() => {
    const v = ['rw', 'rd', 'rh'].map((k, i) => Number(params.get(k)) || CUSTOM_DEFAULT[i])
    return [clampDim(v[0], 2, 14), clampDim(v[1], 2, 12), clampDim(v[2], 2.2, 5)]
  })
  const room = useMemo(() => roomOf(roomId, dims), [roomId, dims])
  const surfaces = useMemo(() => surfacesOf(roomId, dims), [roomId, dims])
  // each room keeps what was laid in it while the visitor looks at the others
  const [laysByRoom, setLaysByRoom] = useState<Partial<Record<RoomId, Record<string, Lay>>>>(() => ({ [roomId]: laysFrom(surfacesOf(roomId, dims), params) }))
  const lays = laysByRoom[roomId] ?? laysFrom(surfaces, null)
  const [hour, setHour] = useState(() => (params.has('t') && Number.isFinite(Number(params.get('t'))) ? Number(params.get('t')) : room.hour))
  const [mood, setMood] = useState<MoodId>(() => (MOODS.find((m) => m.id === params.get('lamps'))?.id ?? 'warm') as MoodId)
  const [weather, setWeather] = useState<WeatherId>(() => (WEATHER.find((w) => w.id === params.get('sky'))?.id ?? 'clear') as WeatherId)
  const [active, setActive] = useState(surfaces[0].id)
  const [view, setView] = useState(room.views[0].id)
  const [viewKey, setViewKey] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [hint, setHint] = useState(true)
  const [job, setJob] = useState<SnapshotJob | null>(null)
  const [panel, setPanel] = useState<'project' | 'dealer' | 'qr' | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [dealer] = useDealer()
  const { items: projectItems, addRoom } = useProject()
  const [photo, setPhoto] = useState<{ url: string | null; progress: number } | null>(null)
  const [quality] = useState<'high' | 'low'>(() => (window.innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high'))
  const stage = useRef<HTMLDivElement>(null)
  const night = weathered(lightAt(hour), weather).day < 0.35
  const surface = surfaces.find((s) => s.id === active) ?? surfaces[0]

  // the room travels in the URL, written a moment after the last change
  useEffect(() => {
    const id = setTimeout(() => {
      const next: Record<string, string> = { room: roomId, t: hour.toFixed(2) }
      if (roomId === 'custom') Object.assign(next, { rw: String(dims[0]), rd: String(dims[1]), rh: String(dims[2]) })
      if (mood !== 'warm') next.lamps = mood
      if (weather !== 'clear') next.sky = weather
      for (const s of surfaces) next[s.id] = encodeLay(lays[s.id])
      setParams(next, { replace: true, preventScrollReset: true })
    }, 400)
    return () => clearTimeout(id)
  }, [lays, hour, mood, weather, roomId, surfaces, dims, setParams])

  // the hour a visitor settles on, counted once it rests
  useEffect(() => {
    if (playing) return
    const id = setTimeout(() => track('hour', String(Math.floor(hour))), 1500)
    return () => clearTimeout(id)
  }, [hour, playing])

  // the showroom screen: the site's frame hidden, the room full screen
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('presenting', presenting)
    if (presenting) {
      track('present')
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    const off = () => !document.fullscreenElement && setPresenting(false)
    document.addEventListener('fullscreenchange', off)
    return () => {
      document.removeEventListener('fullscreenchange', off)
      html.classList.remove('presenting')
    }
  }, [presenting])

  // left alone on the showroom screen, the room shows itself: views and hours in turn, until touched
  useEffect(() => {
    if (!presenting) return
    let idle = 0
    let step = 0
    const moments = [18.3, 20.6, 7.2, 12.5]
    const wake = () => (idle = 0)
    const id = setInterval(() => {
      idle += 1
      if (idle < 45 || idle % 9) return
      step++
      const views = [...room.views.map((v) => v.id), 'plan']
      setView(views[step % views.length])
      setViewKey((k) => k + 1)
      setHour(moments[step % moments.length])
    }, 1000)
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', wake)
    return () => {
      clearInterval(id)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [presenting, room])

  // a day in twenty seconds
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      setHour((h) => (h + dt * 1.2) % 24)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // over a night room the navigation turns light
  useEffect(() => {
    const html = document.documentElement
    const set = () => {
      const over = window.scrollY < (stage.current?.offsetHeight ?? 0) - 60
      html.dataset.tone = over && night ? 'dark' : 'light'
    }
    set()
    window.addEventListener('scroll', set, { passive: true })
    return () => {
      window.removeEventListener('scroll', set)
      delete html.dataset.tone
    }
  }, [night])

  const setLay = (next: Partial<Lay>) => {
    if (next.design) track('lay', next.design)
    if (next.finish) track('finish', next.finish)
    setLaysByRoom((all) => {
      const cur = all[roomId] ?? laysFrom(surfaces, null)
      const was = cur[surface.id]
      return { ...all, [roomId]: { ...cur, [surface.id]: layFor(designById(next.design ?? was.design)!, surface.kind, { ...was, ...next }) } }
    })
  }
  const go = (v: string) => {
    setView(v)
    setViewKey((k) => k + 1)
  }
  const switchRoom = (id: RoomId) => {
    if (id === roomId) return
    track('room', id)
    const r = roomOf(id, dims)
    setLaysByRoom((all) => (all[id] ? all : { ...all, [id]: laysFrom(surfacesOf(id, dims), null) }))
    setRoomId(id)
    setActive(surfacesOf(id, dims)[0].id)
    setView(r.views[0].id)
    setViewKey((k) => k + 1)
    setHour(r.hour)
    setDrawer(false)
  }
  const shoot = () => {
    track('photo', roomId)
    setPlaying(false)
    setPhoto({ url: null, progress: 0 })
    const asked = Number(params.get('samples'))
    setJob({ id: Date.now(), samples: asked > 0 ? Math.min(asked, 400) : quality === 'high' ? 128 : 64 })
  }
  const floorLike = surfaces.find((s) => s.kind === 'floor' || s.kind === 'outdoor') ?? surfaces[0]

  return (
    <div className="st" data-night={night ? '' : undefined}>
      <div className="st-stage" ref={stage} onPointerDown={() => setHint(false)}>
        <div className="st-canvas">
          <Suspense fallback={null}>
            <Scene
              room={room}
              surfaces={surfaces}
              lays={lays}
              hour={hour}
              mood={mood}
              weather={weather}
              view={view}
              viewKey={viewKey}
              onPick={(s) => {
                setActive(s)
                setDrawer(true)
              }}
              snapshot={job}
              onSnapshot={(url, progress) => {
                setPhoto({ url, progress })
                if (url) setJob(null)
              }}
              onReady={() => setReady(true)}
              quality={quality}
            />
          </Suspense>
        </div>
        <AnimatePresence>
          {!ready && (
            <motion.p className="st-loading" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              Laying the room…
            </motion.p>
          )}
        </AnimatePresence>

        <header className="st-head">
          <h1 className="st-title">Orvane Studio</h1>
          <p className="st-where">
            {room.house}, {room.name.toLowerCase()} · <span className="num">{clock(hour)}</span>, {moment(hour)}
            {weather !== 'clear' && `, ${weather === 'rain' ? 'raining' : 'overcast'}`}
          </p>
          <div className="st-chips st-rooms" role="radiogroup" aria-label="Room">
            {[...ROOMS, { id: 'custom' as const, name: 'Your room' }].map((r) => (
              <button key={r.id} role="radio" aria-checked={r.id === roomId} onClick={() => switchRoom(r.id)}>
                {r.name}
              </button>
            ))}
          </div>
          {dealer.on && (dealer.client || dealer.showroom) && (
            <p className="st-for">
              {dealer.client ? `For ${dealer.client}` : ''}
              {dealer.client && dealer.showroom ? ' · ' : ''}
              {dealer.showroom}
            </p>
          )}
          {!presenting && (
            <p className="st-links">
              <TLink className="u" to="/studio/photo" data-cursor="hover">
                Lay it on a photo of your floor →
              </TLink>
              <TLink className="u" to="/studio/upload" data-cursor="hover">
                Add your own design →
              </TLink>
              <button className="u" onClick={() => setPanel(panel === 'dealer' ? null : 'dealer')} data-cursor="hover">
                Dealer mode{dealer.on ? ' (on)' : ''}
              </button>
            </p>
          )}
          {roomId === 'custom' && (
            <div className="st-dims">
              {(['Width', 'Depth', 'Height'] as const).map((label, i) => (
                <label key={label}>
                  <span>{label}</span>
                  <input
                    type="number"
                    step={0.1}
                    min={i === 2 ? 2.2 : 2}
                    max={i === 2 ? 5 : i === 0 ? 14 : 12}
                    value={dims[i]}
                    onChange={(e) => {
                      const v = clampDim(Number(e.target.value), i === 2 ? 2.2 : 2, i === 2 ? 5 : i === 0 ? 14 : 12)
                      setDims((d) => d.map((x, k) => (k === i ? v : x)) as Dims)
                    }}
                  />
                  <span>m</span>
                </label>
              ))}
            </div>
          )}
        </header>

        <AnimatePresence>
          {hint && ready && (
            <motion.p className="st-hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
              Drag to look round · click the floor to walk · double-click a surface to change it
            </motion.p>
          )}
        </AnimatePresence>

        <SurfacePanel surfaces={surfaces} lays={lays} active={surface.id} onActive={setActive} onDrawer={() => setDrawer(true)} setLay={setLay} />
        <LightPanel
          hour={hour}
          onHour={(h) => {
            setPlaying(false)
            setHour(h)
          }}
          playing={playing}
          onPlay={() => setPlaying((p) => !p)}
          mood={mood}
          onMood={setMood}
          weather={weather}
          onWeather={setWeather}
        />
        <ViewPanel
          room={room}
          view={view}
          onView={go}
          onPhoto={shoot}
          lay={lays[surface.id]}
          surface={surface}
          busy={!!job}
          onAddRoom={() => {
            track('project', roomId)
            addRoom(room, surfaces, lays)
            setPanel('project')
          }}
          projectCount={new Set(projectItems.map((i) => i.key.split(':')[0])).size}
          onProject={() => setPanel(panel === 'project' ? null : 'project')}
          onTakeHome={dealer.on || presenting ? () => setPanel('qr') : undefined}
        />
        {presenting && (
          <button className="st-exit" onClick={() => setPresenting(false)} data-cursor="hover">
            Leave the showroom screen
          </button>
        )}
        <AnimatePresence>
          {panel === 'project' && <ProjectDrawer onClose={() => setPanel(null)} />}
          {panel === 'dealer' && (
            <DealerPanel
              onPresent={() => {
                setPanel(null)
                setPresenting(true)
              }}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'qr' && <TakeHome onClose={() => setPanel(null)} />}
        </AnimatePresence>

        <AnimatePresence>
          {drawer && <StonePicker name={surface.name} note={surface.note} kind={surface.kind} lay={lays[surface.id]} onPick={setLay} onClose={() => setDrawer(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {photo && (
            <Photo
              photo={photo}
              caption={`${labelOf(designById(lays[floorLike.id].design)!, lays[floorLike.id].colourway)} · ${room.house}, ${room.name.toLowerCase()} · ${clock(hour)}`}
              file={`orvane-studio-${roomId}-${lays[floorLike.id].design}-${clock(hour).replace(':', '')}.jpg`}
              onClose={() => {
                setJob(null)
                setPhoto(null)
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <section className="st-below" aria-labelledby="st-below-title">
        <h2 id="st-below-title" className="title">
          Every stone here is in the collection.
        </h2>
        <p>
          Six rooms, each laid at true scale: every piece its real size, each one a different window of the stone, the
          joints where they fall. The light is a model of the sun over a coast at 23° N. Photographs are path traced in
          your browser.
        </p>
        <div className="st-below-links">
          <TLink className="btn btn-ink btn-arrow" to="/collections" data-cursor="hover">
            The collection
          </TLink>
          <TLink className="btn btn-line" to="/quote" data-cursor="hover">
            Your sample box
          </TLink>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ surfaces */

function SurfacePanel({
  surfaces,
  lays,
  active,
  onActive,
  onDrawer,
  setLay,
}: {
  surfaces: SurfaceDef[]
  lays: Record<string, Lay>
  active: string
  onActive: (s: string) => void
  onDrawer: () => void
  setLay: (l: Partial<Lay>) => void
}) {
  const s = surfaces.find((x) => x.id === active) ?? surfaces[0]
  const lay = lays[s.id]
  const d = designById(lay.design)!
  const o = optionsFor(d)
  const f = formatById(lay.format)!
  // on a laptop screen the options fold away so the room shows; on a phone they sit below it anyway
  const [open, setOpen] = useState(() => window.innerWidth >= 1280 || window.innerWidth < 900)
  return (
    <section className="st-panel st-surface" aria-label="Surfaces">
      <div className="st-tabs" role="tablist" aria-label="Surface">
        {surfaces.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === s.id} onClick={() => onActive(x.id)} data-cursor="hover">
            {x.name}
          </button>
        ))}
      </div>
      <button className="st-stone" onClick={onDrawer} data-cursor="Change">
        <img src={cardUrl(d, lay.colourway)} alt="" width={720} height={960} />
        <span>
          <b>{labelOf(d, lay.colourway)}</b>
          <span className="st-stone-meta">
            {formatLabel(f)} mm · {PATTERN_NAME[lay.pattern]} · {finishById(lay.finish).name}
          </span>
          <span className="st-stone-change">Change stone →</span>
        </span>
      </button>
      <Quantity surface={s} lay={lay} />
      <TradeLine lay={lay} kind={s.kind} />
      <button className="st-more-toggle" aria-expanded={open} onClick={() => setOpen((x) => !x)} data-cursor="hover">
        {open ? 'Fewer options' : 'Size, pattern and finish'}
      </button>
      {open && (
        <div className="st-more">
          <Row label="Size">
            {o.formats.map((x) => (
              <button key={x.id} role="radio" aria-checked={x.id === lay.format} onClick={() => setLay({ format: x.id })}>
                {formatLabel(x)}
              </button>
            ))}
          </Row>
          <Row label="Pattern">
            {patternsFor(f, s.kind).map((x) => (
              <button key={x} role="radio" aria-checked={x === lay.pattern} onClick={() => setLay({ pattern: x })}>
                {PATTERN_NAME[x]}
              </button>
            ))}
          </Row>
          <Row label="Finish">
            {o.finishes.map((x) => (
              <button key={x.id} role="radio" aria-checked={x.id === lay.finish} onClick={() => setLay({ finish: x.id })}>
                {x.name}
              </button>
            ))}
          </Row>
        </div>
      )}
    </section>
  )
}

/** how much of the stone the surface takes: its area, the pieces with a tenth added for cutting, the boxes or crates */
function Quantity({ surface, lay }: { surface: SurfaceDef; lay: Lay }) {
  const d = designById(lay.design)!
  const s = sampleOf(lay, surface.kind)
  const spec = specFor(d, lay.format, s.thickness, lay.finish)
  const area = surface.planes.reduce((a, p) => a + p.size[0] * p.size[1], 0)
  const pieces = Math.ceil((area / spec.area) * 1.1)
  const n = Math.ceil(pieces / spec.packing.pieces)
  return (
    <p className="st-qty">
      <b className="num">{area.toFixed(1)} m²</b> · {pieces} {pieces === 1 ? 'piece' : 'pieces'} in {packsOf(n, spec.packing.unit)}, a tenth added for
      cutting
    </p>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="st-row">
      <span>{label}</span>
      <div className="st-chips" role="radiogroup" aria-label={label}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ light: the dial, the lamps, the weather */

function LightPanel({
  hour,
  onHour,
  playing,
  onPlay,
  mood,
  onMood,
  weather,
  onWeather,
}: {
  hour: number
  onHour: (h: number) => void
  playing: boolean
  onPlay: () => void
  mood: MoodId
  onMood: (m: MoodId) => void
  weather: WeatherId
  onWeather: (w: WeatherId) => void
}) {
  const ref = useRef<SVGSVGElement>(null)
  const R = 54
  const at = (h: number, r = R) => {
    const t = (h / 24) * Math.PI * 2
    return [60 - r * Math.sin(t), 60 + r * Math.cos(t)]
  }
  const L = lightAt(hour)
  const [kx, ky] = at(hour)
  // the daylight arc, sunrise to sunset over the top
  const [ax, ay] = at(RISE)
  const [bx, by] = at(SET)
  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 120 - 60
    const y = ((e.clientY - r.top) / r.height) * 120 - 60
    const t = Math.atan2(-x, y)
    onHour((((t / (Math.PI * 2)) * 24) % 24 + 24) % 24)
  }
  return (
    <section className="st-panel st-dial" aria-label="Light">
      <svg
        ref={ref}
        viewBox="0 0 120 120"
        role="slider"
        tabIndex={0}
        aria-label="Time of day"
        aria-valuemin={0}
        aria-valuemax={24}
        aria-valuenow={Number(hour.toFixed(2))}
        aria-valuetext={clock(hour)}
        onPointerDown={(e) => {
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => e.buttons && fromPointer(e)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 1 : 0.25
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onHour((hour + step) % 24)
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onHour((hour - step + 24) % 24)
        }}
        data-cursor="hover"
      >
        <circle cx="60" cy="60" r={R} className="st-dial-ring" />
        <path d={`M${ax} ${ay} A${R} ${R} 0 1 1 ${bx} ${by}`} className="st-dial-day" />
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = at(h, R - 7)
          const [x2, y2] = at(h, R - (h % 6 === 0 ? 13 : 10))
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} className="st-dial-tick" />
        })}
        <circle cx={kx} cy={ky} r="7.5" className={L.elevation > -2 ? 'st-dial-sun' : 'st-dial-moon'} />
        <text x="60" y="58" className="st-dial-time">
          {clock(hour)}
        </text>
        <text x="60" y="72" className="st-dial-sub">
          {L.elevation > 0 ? `sun ${Math.round(L.elevation)}°` : 'night'}
        </text>
      </svg>
      <div className="st-dial-side">
        <div className="st-chips" role="group" aria-label="Moments">
          {MOMENTS.map((m) => (
            <button key={m.name} onClick={() => onHour(m.hour)} aria-pressed={Math.abs(hour - m.hour) < 0.2}>
              {m.name}
            </button>
          ))}
        </div>
        <button className="st-play" onClick={onPlay} aria-pressed={playing} data-cursor="hover">
          {playing ? 'Pause the day' : 'Play a day'}
        </button>
      </div>
      <div className="st-light-rows">
        <Row label="Lamps">
          {MOODS.map((m) => (
            <button key={m.id} role="radio" aria-checked={m.id === mood} onClick={() => onMood(m.id)}>
              {m.name}
            </button>
          ))}
        </Row>
        <Row label="Sky">
          {WEATHER.map((w) => (
            <button key={w.id} role="radio" aria-checked={w.id === weather} onClick={() => onWeather(w.id)}>
              {w.name}
            </button>
          ))}
        </Row>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ views */

function ViewPanel({
  room,
  view,
  onView,
  onPhoto,
  lay,
  surface,
  busy,
  onAddRoom,
  projectCount,
  onProject,
  onTakeHome,
}: {
  room: RoomDef
  view: string
  onView: (v: string) => void
  onPhoto: () => void
  lay: Lay
  surface: SurfaceDef
  busy: boolean
  onAddRoom: () => void
  projectCount: number
  onProject: () => void
  onTakeHome?: () => void
}) {
  const { add, hasExact, items } = useQuote()
  const sample = sampleOf(lay, surface.kind)
  const inBox = hasExact(sample)
  const full = items.length >= MAX_SAMPLES
  return (
    <section className="st-panel st-views" aria-label="Views">
      <div className="st-chips" role="radiogroup" aria-label="Where to stand">
        {[...room.views, { id: 'plan', name: 'Plan' }].map((v) => (
          <button key={v.id} role="radio" aria-checked={v.id === view} onClick={() => onView(v.id)}>
            {v.name}
          </button>
        ))}
      </div>
      <div className="st-actions">
        <button className="btn btn-ink btn-sm" onClick={onPhoto} disabled={busy} data-cursor="hover">
          Take a photograph
        </button>
        <ShareButton />
        <ArButton lay={lay} />
        {!designById(lay.design)?.own && (
          <button
            className="btn btn-line btn-sm"
            onClick={() => {
              track('sample', lay.design)
              add(sample)
            }}
            disabled={inBox || full}
            data-cursor="hover"
          >
            {inBox ? 'In your sample box' : full ? 'Sample box full' : 'Sample this stone'}
          </button>
        )}
        {onTakeHome && (
          <button className="btn btn-line btn-sm" onClick={onTakeHome} data-cursor="hover">
            Take this room home
          </button>
        )}
      </div>
      <div className="st-actions st-project-actions">
        <button className="btn btn-line btn-sm" onClick={onAddRoom} data-cursor="hover">
          Add room to project
        </button>
        <button className="st-project-open" onClick={onProject} data-cursor="hover">
          Project{projectCount ? ` · ${projectCount} ${projectCount === 1 ? 'room' : 'rooms'}` : ''}
        </button>
      </div>
    </section>
  )
}

/** the stone on the visitor's own floor through the phone's camera, where the phone can do it */
function ArButton({ lay }: { lay: Lay }) {
  const [kind, setKind] = useState<'quicklook' | 'webxr' | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    // only a phone or tablet that can place things in the room gets the button
    if (!matchMedia('(pointer: coarse)').matches) return
    import('../studio/ar').then((m) => m.arSupport()).then(setKind)
  }, [])
  if (!kind) return null
  const d = designById(lay.design)!
  return (
    <button
      className="btn btn-line btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        track('ar', kind)
        try {
          const [m, tex] = await Promise.all([import('../studio/ar'), paintLay(lay, [2, 2], 700)])
          const look = finishById(lay.finish).look
          if (kind === 'quicklook') await m.openQuickLook(tex, 2, look, `orvane-${d.id}`)
          else await m.openWebXR(tex, 2, look, labelOf(d, lay.colourway))
        } finally {
          setBusy(false)
        }
      }}
      data-cursor="hover"
    >
      {busy ? 'Opening the camera…' : 'See it on your floor'}
    </button>
  )
}

/** copies the room's link: everything on every surface, the hour, the lamps and the sky */
function ShareButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn btn-line btn-sm"
      onClick={() => {
        track('share')
        navigator.clipboard?.writeText(window.location.href).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        })
      }}
      data-cursor="hover"
    >
      {copied ? 'Link copied' : 'Share this room'}
    </button>
  )
}

/* ------------------------------------------------------------------ the photograph */

function Photo({ photo, caption, file, onClose }: { photo: { url: string | null; progress: number }; caption: string; file: string; onClose: () => void }) {
  if (!photo.url)
    return (
      <motion.div className="st-developing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status">
        <span>Developing the photograph</span>
        <span className="st-bar" aria-hidden>
          <b style={{ transform: `scaleX(${photo.progress})` }} />
        </span>
        <span className="num">{Math.round(photo.progress * 100)}%</span>
        <button onClick={onClose} data-cursor="hover">
          Cancel
        </button>
      </motion.div>
    )
  return (
    <motion.div className="st-photo" role="dialog" aria-modal="true" aria-label="Your photograph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <figure>
        <img src={photo.url} alt={caption} />
        <figcaption>{caption}</figcaption>
      </figure>
      <div className="st-photo-actions">
        <a className="btn btn-light btn-arrow" href={photo.url} download={file} data-cursor="hover">
          Save the photograph
        </a>
        <button className="btn btn-line st-photo-back" onClick={onClose} data-cursor="hover">
          Back to the room
        </button>
      </div>
    </motion.div>
  )
}
