import { useRef, useState } from 'react'
import { CertBadge, DemoNote } from '../components/Demo'
import { InteriorImage } from '../components/Interior'
import { Close, shot } from '../components/Showcase'
import { TechList } from '../components/TechList'
import { TECHNOLOGIES } from '../data/range'
import { CERTS, TESTS } from '../data/standards'
import { TLink } from '../motion/Transition'
import { useReveal } from '../motion/useReveal'
import './showcase.css'

// The technology index: the three films first, each a line of large type with
// its room beside it in one frame that changes as you point at a line; then
// the six technologies; then the tests the range is made to, and the
// certificates a manufacturer would show here.

const FILMS = [
  {
    to: '/technology/scale',
    name: 'The largest slab',
    say: '1800 × 3600 mm, beside a person, a door and a room.',
    room: 'maesta-portoro-dining',
  },
  {
    to: '/technology/surface-lab',
    name: 'Surface lab',
    say: 'Tilt it, stain it, heat it, scratch it, hold it to the light.',
    room: 'terme-bianco-shower',
  },
  {
    to: '/technology/vein',
    name: 'Continuous vein',
    say: 'Four slabs fall into sequence, and a bookmatch opens like a book.',
    room: 'gemelli-azzurro-living',
  },
]

export default function Technology() {
  const root = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  useReveal(root)
  return (
    <div className="sh tc" ref={root}>
      <header className="tc-head">
        <h1 className="tc-title o-lines" data-rv>
          <span>
            <span>Technology.</span>
          </span>
        </h1>
        <p className="lead" data-rv>
          Six things we do to porcelain so it looks, wears and behaves like stone. Three of them have a film of their
          own.
        </p>
      </header>

      <section className="tc-films" aria-labelledby="tc-films-title">
        <h2 id="tc-films-title" className="visually-hidden">
          Three films
        </h2>
        <ol className="tc-film-list">
          {FILMS.map((f, i) => (
            <li key={f.to} data-rv>
              <TLink
                to={f.to}
                className="tc-film"
                data-on={i === at ? '' : undefined}
                onPointerEnter={() => setAt(i)}
                onFocus={() => setAt(i)}
                data-cursor="Watch"
              >
                <span className="tc-film-pic" aria-hidden>
                  <InteriorImage shot={shot(f.room)} sizes="90vw" />
                </span>
                <span className="tc-film-name">{f.name}</span>
                <span className="tc-film-say">{f.say}</span>
              </TLink>
            </li>
          ))}
        </ol>
        <figure className="tc-frame" aria-hidden>
          {FILMS.map((f, i) => (
            <span key={f.to} data-on={i === at ? '' : undefined}>
              <InteriorImage shot={shot(f.room)} sizes="40vw" />
            </span>
          ))}
        </figure>
      </section>

      <section className="sh-sec" aria-labelledby="tc-six-title">
        <header className="sh-head">
          <h2 id="tc-six-title" className="head" data-rv>
            The six.
          </h2>
          <p className="lead" data-rv>
            Each one named, each one shown working: on a ramp, under a stain, across four slabs.
          </p>
        </header>
        <TechList techs={TECHNOLOGIES.map((t) => t.id)} links />
      </section>

      <section className="sh-sec" aria-labelledby="tc-tests-title">
        <header className="sh-head">
          <h2 id="tc-tests-title" className="head" data-rv>
            Tested to.
          </h2>
          <p className="lead" data-rv>
            The standards a buyer’s specification names, and what the range returns on each.
          </p>
        </header>
        <table className="tc-tests" data-rv>
          <thead>
            <tr>
              <th scope="col">Standard</th>
              <th scope="col">Test</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map(([code, what, result]) => (
              <tr key={code}>
                <th scope="row">{code}</th>
                <td>{what}</td>
                <td>{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <DemoNote topic="tests" />
      </section>

      <section className="sh-sec" aria-labelledby="tc-certs-title">
        <header className="sh-head">
          <h2 id="tc-certs-title" className="head" data-rv>
            Certified.
          </h2>
          <p className="lead" data-rv>
            Where a manufacturer shows its certificates. Ours are drawn as badges of our own; the real marks go here.
          </p>
        </header>
        <div className="tc-certs" data-rv>
          {CERTS.map(([code, label]) => (
            <CertBadge key={code} code={code} label={label} />
          ))}
        </div>
        <DemoNote topic="certifications" />
      </section>

      <Close
        id="tc-close"
        title="See it on a sample."
        say="Every technology here is on a piece you can hold. Choose up to six and we send them from Morbi."
        fact="Bookmatched pairs, numbered sets and every finish"
        image={<img src="/renders/show/pair-azzurro.jpg" alt="" width={1034} height={1920} loading="lazy" className="tc-close-img" />}
        actions={[
          { to: '/quote', label: 'Order samples' },
          { to: '/collections', label: 'The collection' },
        ]}
      />
    </div>
  )
}
