import { AnimatePresence, motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { CONTAINERS, SIZES, containerLoad, sizeById, type ContainerId, type SizeId } from '../data/catalog'
import { num, num1 } from '../lib/format'
import { useWipe } from '../motion/useWipe'
import { AnimatedNumber } from './AnimatedNumber'
import './ContainerCalc.css'

// interior floor in metres, and a tile pallet footprint
const FLOOR = { '20ft': 5.9, '40ft': 12.03 } as const
const WIDTH = 2.35
const PALLET = 1.1
const GAP = 0.05

export function ContainerCalc() {
  const [sizeId, setSizeId] = useState<SizeId>('600x1200')
  const [container, setContainer] = useState<ContainerId>('20ft')
  const size = sizeById(sizeId)
  const load = containerLoad(size, container)
  const length = FLOOR[container]
  const perTier = Math.floor(length / (PALLET + GAP)) * 2
  const sheet = useRef<HTMLElement>(null)
  useWipe(sheet)

  return (
    <section className="calc" id="containers" aria-labelledby="calc-title" ref={sheet}>
      <div className="wrap calc-grid">
        <div className="calc-intro">
          <h2 className="h2" id="calc-title">
            How much fits in one container.
          </h2>
          <p className="lede">
            Tiles reach a container's weight limit long before they fill it, which is why most tile orders ship in
            20-foot boxes. Pick a size to see a typical load.
          </p>

          <div className="calc-controls">
            <fieldset>
              <legend>Tile size (mm)</legend>
              <div className="calc-chips">
                {SIZES.map((s) => (
                  <button key={s.id} className="chip" aria-pressed={s.id === sizeId} onClick={() => setSizeId(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Container</legend>
              <div className="segmented calc-seg" role="radiogroup" aria-label="Container">
                {(Object.keys(CONTAINERS) as ContainerId[]).map((c) => (
                  <button key={c} role="radio" aria-checked={c === container} onClick={() => setContainer(c)}>
                    {c === container && (
                      <motion.span
                        className="segmented-thumb"
                        layoutId="container-thumb"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="segmented-label">{CONTAINERS[c].label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="calc-result">
          <dl className="calc-stats">
            <div>
              <dt>Boxes</dt>
              <dd>
                <AnimatedNumber value={load.boxes} format={num} />
              </dd>
            </div>
            <div>
              <dt>Square metres</dt>
              <dd>
                <AnimatedNumber value={load.sqm} format={num} />
              </dd>
            </div>
            <div>
              <dt>Pallets</dt>
              <dd>
                <AnimatedNumber value={load.pallets} format={num} />
              </dd>
            </div>
            <div>
              <dt>Gross weight</dt>
              <dd>
                <AnimatedNumber value={load.kg / 1000} format={(n) => `${num1(n)} t`} />
              </dd>
            </div>
          </dl>

          <div className="plan-wrap">
            <motion.div
              className="plan"
              layout
              style={{ aspectRatio: `${length} / ${WIDTH}`, width: container === '20ft' ? '49%' : '100%' }}
              transition={{ type: 'spring', stiffness: 160, damping: 26 }}
              role="img"
              aria-label={`Floor plan of a ${CONTAINERS[container].label} container holding ${load.pallets} pallets`}
            >
              <AnimatePresence>
                {Array.from({ length: load.pallets }, (_, i) => {
                  const tier = i < perTier ? 0 : 1
                  const j = i - tier * perTier
                  const col = Math.floor(j / 2)
                  const row = j % 2
                  return (
                    <motion.span
                      key={i}
                      className="pallet"
                      data-tier={tier}
                      initial={{ opacity: 0, scale: 1.3 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        left: `${((GAP + col * (PALLET + GAP)) / length) * 100}%`,
                        top: `${((0.06 + row * (PALLET + GAP)) / WIDTH) * 100}%`,
                      }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      transition={{ delay: i * 0.025, type: 'spring', stiffness: 300, damping: 26 }}
                      style={{ width: `${(PALLET / length) * 100}%`, height: `${(PALLET / WIDTH) * 100}%` }}
                    />
                  )
                })}
              </AnimatePresence>
              <span className="plan-doors" aria-hidden />
            </motion.div>
            <p className="plan-caption">
              Floor plan, {CONTAINERS[container].label}. Each block is one pallet of {size.boxesPerPallet} boxes; the
              darker ones are stacked on top.
            </p>
          </div>

          <div className="calc-bars">
            <Bar label="Payload used" value={load.weightShare} />
            <Bar label="Space used" value={load.volumeShare} />
          </div>
          <p className="calc-note">
            Indicative for {size.thickness} mm tiles at {num1(CONTAINERS[container].payloadKg / 1000)} t payload. Your
            quote confirms the exact packing list.
          </p>
        </div>
      </div>
    </section>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  return (
    <div className="bar" ref={ref}>
      <div className="bar-label">
        <span>{label}</span>
        <span className="num">{Math.round(value * 100)}%</span>
      </div>
      <div className="bar-track">
        <motion.div
          className="bar-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? value : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  )
}
