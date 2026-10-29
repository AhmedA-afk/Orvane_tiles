import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DemoNote } from '../components/Demo'
import { cardUrl, designById, finishById, formatById, formatLabel, labelOf, optionsFor } from '../data/range'
import { TLink } from '../motion/Transition'
import { loadImage, paintLay } from '../studio/paint'
import { composeFloor, greyOf, SAMPLE, U, V, type P, type Quad, type Stroke } from '../studio/photo'
import { encodeLay, layFor, PATTERN_NAME, patternsFor, type Lay } from '../studio/state'
import { StonePicker } from '../studio/StonePicker'
import { track } from '../studio/insights'
import './studio.css'

// Your own room: a photograph of a floor, and any stone laid on it. Drag the
// four corners onto a rectangle of the floor and say how big it is; the stone
// is laid on that plane in true perspective and at true scale, carried out to
// the floor's edges, with the photograph's own light and shadow kept over it.
// Paint to add floor the outline missed, or to keep what stands on it. The
// picture never leaves the visitor's device.

export default function PhotoStudio() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [quad, setQuad] = useState<Quad>(SAMPLE.quad)
  const [mask, setMask] = useState<P[]>(SAMPLE.mask)
  const [size, setSize] = useState<[number, number]>(SAMPLE.size)
  const [lay, setLayState] = useState<Lay>(() => layFor(designById('calacatta')!, 'floor', { format: '1200x2400', finish: 'glossy' }))
  const [shade, setShade] = useState(0.55)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [brush, setBrush] = useState<'off' | 'floor' | 'keep'>('off')
  const [radius, setRadius] = useState(28)
  const [picker, setPicker] = useState(false)
  const [tex, setTex] = useState<HTMLCanvasElement | null>(null)
  const [scale, setScale] = useState(0.5)
  const [busy, setBusy] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<number | null>(null)
  const painting = useRef(false)
  const fast = useRef(false)

  useEffect(() => {
    loadImage(SAMPLE.src).then(setImg)
  }, [])

  // the photograph in grey, for laying its light over the stone
  const grey = useMemo(() => (img ? greyOf(img) : null), [img])

  // the stone, laid over the whole plane at true scale
  useEffect(() => {
    let live = true
    paintLay(lay, [size[0] * (U[1] - U[0]), size[1] * (V[1] - V[0])], 360).then((c) => live && setTex(c))
    return () => {
      live = false
    }
  }, [lay, size])

  // the canvas fits the column; the photo keeps its shape
  useEffect(() => {
    const el = stage.current
    if (!el || !img) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / img.naturalWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [img])

  const compose = useCallback(
    (target: HTMLCanvasElement, k: number, n: number) => {
      if (img && tex && grey) composeFloor(target, { img, grey, tex, quad, mask, strokes, shade }, k, n)
    },
    [img, tex, grey, quad, mask, strokes, shade],
  )

  // redraw: coarse while a corner moves, fine once it rests
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let raf = requestAnimationFrame(() => compose(c, scale * dpr, fast.current ? 14 : 24))
    const fine = setTimeout(() => {
      if (!fast.current) return
      fast.current = false
      raf = requestAnimationFrame(() => compose(c, scale * dpr, 30))
    }, 180)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fine)
    }
  }, [compose, scale])

  const toPhoto = (e: React.PointerEvent): P => {
    const r = canvas.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]
  }

  const upload = (file: File) => {
    const url = URL.createObjectURL(file)
    loadImage(url).then((i) => {
      const w = i.naturalWidth
      const h = i.naturalHeight
      // a first guess at the floor: a trapezoid in the lower half, for the visitor to move
      const q: Quad = [
        [w * 0.32, h * 0.58],
        [w * 0.68, h * 0.58],
        [w * 0.96, h * 0.97],
        [w * 0.04, h * 0.97],
      ]
      setImg(i)
      setQuad(q)
      setMask(q.map((p) => [...p] as P))
      setSize([3, 4])
      setStrokes([])
    })
  }

  const save = () => {
    if (!img) return
    track('photoSave')
    setBusy(true)
    requestAnimationFrame(() => {
      const c = document.createElement('canvas')
      compose(c, 1, 44)
      c.toBlob(
        (b) => {
          setBusy(false)
          if (!b) return
          const a = document.createElement('a')
          a.href = URL.createObjectURL(b)
          a.download = `orvane-${lay.design}-on-your-floor.jpg`
          a.click()
        },
        'image/jpeg',
        0.92,
      )
    })
  }

  const d = designById(lay.design)!
  const o = optionsFor(d)
  const f = formatById(lay.format)!
  const setLay = (next: Partial<Lay>) => {
    if (next.design) track('photoLay', next.design)
    setLayState((cur) => layFor(designById(next.design ?? cur.design)!, 'floor', { ...cur, ...next }))
  }

  return (
    <div className="st ph">
      <header className="ph-head">
        <h1 className="ph-title">Your room, in stone.</h1>
        <p className="lead">
          Lay any design on a photograph of your own floor, in perspective and at true size. Your picture stays on your
          device.
        </p>
      </header>

      <div className="ph-tool">
        <div className="ph-stage-wrap">
          <div
            className="ph-stage"
            ref={stage}
            data-brush={brush === 'off' ? undefined : brush}
            style={{ aspectRatio: img ? `${img.naturalWidth} / ${img.naturalHeight}` : '16 / 9', ['--r' as string]: `${radius * scale * 2}px` }}
          >
            <canvas
              ref={canvas}
              className="ph-canvas"
              aria-label={`Your photograph with the floor laid in ${labelOf(d, lay.colourway)}`}
              role="img"
              onPointerDown={(e) => {
                if (brush === 'off') return
                ;(e.target as Element).setPointerCapture(e.pointerId)
                painting.current = true
                fast.current = true
                setStrokes((s) => [...s, { mode: brush, r: radius, pts: [toPhoto(e)] }])
              }}
              onPointerMove={(e) => {
                if (!painting.current) return
                fast.current = true
                const p = toPhoto(e)
                setStrokes((s) => {
                  const last = s[s.length - 1]
                  return [...s.slice(0, -1), { ...last, pts: [...last.pts, p] }]
                })
              }}
              onPointerUp={() => (painting.current = false)}
            />
            {brush === 'off' &&
              quad.map((p, i) => (
                <button
                  key={i}
                  className="ph-handle"
                  style={{ left: `${(p[0] / (img?.naturalWidth ?? 1)) * 100}%`, top: `${(p[1] / (img?.naturalHeight ?? 1)) * 100}%` }}
                  aria-label={['Far left corner', 'Far right corner', 'Near right corner', 'Near left corner'][i]}
                  onPointerDown={(e) => {
                    ;(e.target as Element).setPointerCapture(e.pointerId)
                    drag.current = i
                  }}
                  onPointerMove={(e) => {
                    if (drag.current !== i || !img) return
                    fast.current = true
                    const r = canvas.current!.getBoundingClientRect()
                    // a corner may sit past the photo's edge, where the floor runs out of frame
                    const x = Math.max(-0.5, Math.min(1.5, (e.clientX - r.left) / r.width)) * img.naturalWidth
                    const y = Math.max(-0.2, Math.min(1.2, (e.clientY - r.top) / r.height)) * img.naturalHeight
                    setQuad((q) => q.map((c, k) => (k === i ? [x, y] : c)) as Quad)
                  }}
                  onPointerUp={() => {
                    drag.current = null
                  }}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 20 : 4
                    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
                    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
                    if (!dx && !dy) return
                    e.preventDefault()
                    setQuad((q) => q.map((c, k) => (k === i ? [c[0] + dx, c[1] + dy] : c)) as Quad)
                  }}
                />
              ))}
          </div>
          <p className="ph-help">
            {brush === 'off'
              ? 'Drag the four corners onto a rectangle of the floor, a rug’s outline or the line of a wall, then give its size.'
              : brush === 'floor'
                ? 'Paint over floor the stone has not reached.'
                : 'Paint over anything standing on the floor to keep it.'}
          </p>
        </div>

        <aside className="ph-controls" aria-label="Settings">
          <section className="ph-group">
            <h2 className="ph-label">Photograph</h2>
            <div className="st-actions">
              <label className="btn btn-ink btn-sm ph-upload" data-cursor="hover">
                Use your photo
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              <button
                className="btn btn-line btn-sm"
                onClick={() => {
                  loadImage(SAMPLE.src).then(setImg)
                  setQuad(SAMPLE.quad)
                  setMask(SAMPLE.mask)
                  setSize(SAMPLE.size)
                  setStrokes([])
                }}
                data-cursor="hover"
              >
                Our sample room
              </button>
            </div>
          </section>

          <section className="ph-group">
            <h2 className="ph-label">The rectangle you marked</h2>
            <div className="ph-size">
              {(['Across', 'Deep'] as const).map((label, i) => (
                <label key={label}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min={0.5}
                    max={30}
                    step={0.1}
                    value={size[i]}
                    onChange={(e) => {
                      const v = Math.max(0.5, Math.min(30, Number(e.target.value) || 0.5))
                      setSize((s) => (i ? [s[0], v] : [v, s[1]]))
                    }}
                  />
                  <span>m</span>
                </label>
              ))}
            </div>
          </section>

          <section className="ph-group">
            <h2 className="ph-label">Stone</h2>
            <button className="st-stone" onClick={() => setPicker(true)} data-cursor="Change">
              <img src={cardUrl(d, lay.colourway)} alt="" width={720} height={960} />
              <span>
                <b>{labelOf(d, lay.colourway)}</b>
                <span className="st-stone-meta">
                  {formatLabel(f)} mm · {PATTERN_NAME[lay.pattern]} · {finishById(lay.finish).name}
                </span>
                <span className="st-stone-change">Change stone →</span>
              </span>
            </button>
            <div className="st-row">
              <span>Size</span>
              <div className="st-chips" role="radiogroup" aria-label="Size">
                {o.formats.map((x) => (
                  <button key={x.id} role="radio" aria-checked={x.id === lay.format} onClick={() => setLay({ format: x.id })}>
                    {formatLabel(x)}
                  </button>
                ))}
              </div>
            </div>
            <div className="st-row">
              <span>Pattern</span>
              <div className="st-chips" role="radiogroup" aria-label="Pattern">
                {patternsFor(f, 'floor')
                  .filter((p) => p !== 'bookmatch')
                  .map((x) => (
                    <button key={x} role="radio" aria-checked={x === lay.pattern} onClick={() => setLay({ pattern: x })}>
                      {PATTERN_NAME[x]}
                    </button>
                  ))}
              </div>
            </div>
          </section>

          <section className="ph-group">
            <h2 className="ph-label">Light and outline</h2>
            <label className="ph-range">
              <span>Keep the photo’s light</span>
              <input type="range" min={0} max={1} step={0.05} value={shade} onChange={(e) => setShade(Number(e.target.value))} />
            </label>
            <div className="st-chips" role="radiogroup" aria-label="Brush">
              {(
                [
                  ['off', 'Move corners'],
                  ['floor', 'Paint floor'],
                  ['keep', 'Keep objects'],
                ] as const
              ).map(([id, name]) => (
                <button key={id} role="radio" aria-checked={brush === id} onClick={() => setBrush(id)}>
                  {name}
                </button>
              ))}
            </div>
            {brush !== 'off' && (
              <label className="ph-range">
                <span>Brush</span>
                <input type="range" min={8} max={90} step={2} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
              </label>
            )}
            {strokes.length > 0 && (
              <div className="st-actions">
                <button className="btn btn-line btn-sm" onClick={() => setStrokes((s) => s.slice(0, -1))} data-cursor="hover">
                  Undo
                </button>
                <button className="btn btn-line btn-sm" onClick={() => setStrokes([])} data-cursor="hover">
                  Clear painting
                </button>
              </div>
            )}
          </section>

          <div className="st-actions ph-final">
            <button className="btn btn-ink btn-arrow" onClick={save} disabled={busy || !tex} data-cursor="hover">
              {busy ? 'Saving…' : 'Save the image'}
            </button>
            <TLink className="btn btn-line" to={`/studio?room=living&floor=${encodeLay(lay)}`} data-cursor="hover">
              Walk round it in the Studio
            </TLink>
          </div>
          <DemoNote topic="imagery" />
        </aside>
      </div>

      <AnimatePresence>
        {picker && <StonePicker name="Your floor" note="Laid on your photograph" kind="floor" lay={lay} onPick={setLay} onClose={() => setPicker(false)} />}
      </AnimatePresence>
    </div>
  )
}
