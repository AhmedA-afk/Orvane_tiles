import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { formatById, formatLabel, LINES, lineById, type LineId } from '../data/range'
import { TLink } from '../motion/Transition'
import { loadImage } from '../studio/paint'
import { encodeLay, layFor } from '../studio/state'
import { addOwn, removeOwn, useOwnDesigns } from '../studio/uploads'
import { track } from '../studio/insights'
import './studio.css'

// Add your own design: a picture of a slab or a tile, cropped to the piece it
// shows, named and given a line, then laid in the Studio at true size. For a
// manufacturer, the way to see a design in a room before it is printed. The
// picture is kept on this device and goes nowhere else.

export default function UploadPage() {
  const nav = useNavigate()
  const { designs } = useOwnDesigns()
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [name, setName] = useState('')
  const [line, setLine] = useState<LineId>('maesta')
  const [piece, setPiece] = useState('1600x3200')
  const [turn, setTurn] = useState(0)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const preview = useRef<HTMLCanvasElement>(null)
  const L = lineById(line)
  const formats = useMemo(() => L.formats.map((f) => formatById(f)!), [L])
  const f = formatById(piece) ?? formats[formats.length - 1]

  // a line offers its own sizes; keep the piece one of them
  useEffect(() => {
    if (!L.formats.includes(piece)) setPiece(L.formats[L.formats.length - 1])
  }, [L, piece])

  const open = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    loadImage(URL.createObjectURL(file)).then((i) => {
      setImg(i)
      setTurn(i.naturalWidth > i.naturalHeight ? 1 : 0)
      if (!name) setName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 40))
    })
  }

  // the crop the design will keep: the piece's proportions, taller than wide
  const want = Math.min(f.w, f.h) / Math.max(f.w, f.h)
  const turned = img ? (turn % 2 ? [img.naturalHeight, img.naturalWidth] : [img.naturalWidth, img.naturalHeight]) : [1, 1]
  const crop = turned[0] / turned[1] > want ? { w: (want * turned[1]) / turned[0], h: 1 } : { w: 1, h: turned[0] / want / turned[1] }

  // the picture as it will be cut: turned, drawn small for the page
  useEffect(() => {
    const c = preview.current
    if (!c || !img) return
    const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
    const w = img.naturalWidth * k
    const h = img.naturalHeight * k
    c.width = turn % 2 ? h : w
    c.height = turn % 2 ? w : h
    const g = c.getContext('2d')!
    g.translate(c.width / 2, c.height / 2)
    g.rotate((turn * Math.PI) / 2)
    g.drawImage(img, -w / 2, -h / 2, w, h)
  }, [img, turn])

  const save = async () => {
    if (!img) return
    setBusy(true)
    try {
      track('upload', line)
      const d = await addOwn(img, { name, line, piece: [Math.min(f.w, f.h), Math.max(f.w, f.h)], turn })
      const kind = line === 'aperto' ? 'outdoor' : 'floor'
      const lay = layFor(d, kind, { format: f.id })
      nav(`/studio?room=${line === 'aperto' ? 'pool' : 'living'}&${line === 'aperto' ? 'deck' : 'floor'}=${encodeLay(lay)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="st up">
      <header className="ph-head">
        <h1 className="ph-title">Your design, in a room.</h1>
        <p className="lead">
          Add a picture of a slab or a tile and lay it in the Studio at true size: the way to see a design in a room before
          it is printed. It stays on this device.
        </p>
      </header>

      <div className="ph-tool">
        <div>
          <label
            className="up-drop"
            data-over={over ? '' : undefined}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              open(e.dataTransfer.files[0])
            }}
          >
            <input type="file" accept="image/*" onChange={(e) => open(e.target.files?.[0])} />
            {img ? (
              <span className="up-preview">
                <canvas ref={preview} role="img" aria-label="Your picture, as it will be cut" />
                <span className="up-crop" style={{ width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }} aria-hidden />
              </span>
            ) : (
              <span className="up-empty">
                <b>Drop a picture here</b>
                <span>or click to choose one: a scan, a photograph taken straight on, a render</span>
              </span>
            )}
          </label>
          {img && (
            <p className="ph-help">
              The bright frame is what is kept: one {formatLabel(f)} mm piece.{' '}
              <button className="u up-turn" onClick={() => setTurn((t) => (t + 1) % 4)}>
                Turn the picture
              </button>
            </p>
          )}
        </div>

        <aside className="ph-controls" aria-label="Your design">
          <section className="ph-group">
            <h2 className="ph-label">Name</h2>
            <input className="up-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Calacatta Nuovo" maxLength={40} />
          </section>
          <section className="ph-group">
            <h2 className="ph-label">Line</h2>
            <div className="st-chips" role="radiogroup" aria-label="Line">
              {LINES.map((l) => (
                <button key={l.id} role="radio" aria-checked={l.id === line} onClick={() => setLine(l.id)}>
                  {l.name}
                </button>
              ))}
            </div>
            <p className="up-note">{L.kind}: its sizes, thicknesses and finishes are offered for your design.</p>
          </section>
          <section className="ph-group">
            <h2 className="ph-label">The picture shows one piece of</h2>
            <div className="st-chips" role="radiogroup" aria-label="Piece size">
              {formats.map((x) => (
                <button key={x.id} role="radio" aria-checked={x.id === f.id} onClick={() => setPiece(x.id)}>
                  {formatLabel(x)}
                </button>
              ))}
            </div>
          </section>
          <div className="st-actions ph-final">
            <button className="btn btn-ink btn-arrow" onClick={save} disabled={!img || busy} data-cursor="hover">
              {busy ? 'Laying it…' : 'Lay it in the Studio'}
            </button>
          </div>
        </aside>
      </div>

      {designs.length > 0 && (
        <section className="sh-sec up-list" aria-labelledby="up-mine">
          <h2 id="up-mine" className="title">
            Your designs on this device.
          </h2>
          <ul>
            {designs.map((d) => (
              <li key={d.id}>
                <img src={d.colourways[0].sm} alt="" width={90} height={180} />
                <span>
                  <b>{d.name}</b>
                  <span>
                    {lineById(d.line).name} · {d.master?.join(' × ')} mm
                  </span>
                </span>
                <TLink className="btn btn-line btn-sm" to={`/studio?room=living&floor=${encodeLay(layFor(d, 'floor'))}`} data-cursor="hover">
                  Lay it
                </TLink>
                <button className="btn btn-line btn-sm" onClick={() => removeOwn(d.id)} data-cursor="hover">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
