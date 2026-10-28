import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { PRODUCTS, sizeById, type Finish } from '../data/catalog'
import { faceNormal, Gallery, mirrorLight } from '../three/Gallery'
import { Studio } from '../three/Studio'
import { ContactShadows } from '@react-three/drei'
import { RoomContents } from '../three/Room'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { WebGLPathTracer } from 'three-gpu-pathtracer'
import skyUrl from './hdr/sky-2k.hdr?url'
import { Slab, SLAB } from '../three/Slab'
import { designById, finishById, formatById, lineById } from '../data/range'
import { faceOf, metres, windowFor } from '../three/surface'

// Still renderer: one scene per URL, e.g.
//   /render.html?scene=portrait&design=nero&bg=%23101112
// When the scene has settled it sets window.__ready, and
// scripts/render-stills.mjs takes the screenshot.

type V3 = [number, number, number]

// pale stones lose a white reflection against a white face; they get less fill and a harder streak
const LIGHT_STONES = new Set(['statuario', 'calacatta', 'ivory', 'crema', 'bardiglio', 'pepper', 'terrazzo'])

const q = new URLSearchParams(location.search)
const scene = q.get('scene') ?? 'portrait'
const design = q.get('design') ?? 'statuario'
const bg = q.get('bg') ?? '#161c1a'
const finish = (q.get('finish') ?? 'Glossy') as Finish

declare global {
  interface Window {
    __ready?: boolean
    __samples?: number
  }
}

function Ready() {
  const n = useRef(0)
  useFrame(() => {
    if (++n.current === 45) window.__ready = true
  })
  return null
}

/** a real sky, lighting the scene and seen through its windows */
function Sky({ intensity = 1 }: { intensity?: number }) {
  const tex = useLoader(HDRLoader, skyUrl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    tex.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = tex
    scene.environmentIntensity = intensity
    scene.background = tex
  }, [tex, scene, intensity])
  return null
}

/** path traces the scene until it has `samples` samples, then marks the still ready */
function PathTrace({ samples = 400 }: { samples?: number }) {
  const { gl, scene, camera } = useThree()
  const pt = useRef<WebGLPathTracer | null>(null)
  const frames = useRef(0)
  useEffect(() => {
    const p = new WebGLPathTracer(gl)
    p.tiles.set(2, 2)
    p.bounces = 7
    p.transmissiveBounces = 4
    p.filterGlossyFactor = 0.15
    p.minSamples = 1
    p.fadeDuration = 0
    p.renderDelay = 0
    pt.current = p
    return () => p.dispose()
  }, [gl])
  useFrame(() => {
    const p = pt.current
    if (!p) return
    frames.current++
    if (frames.current < 40) {
      gl.render(scene, camera)
      return
    }
    if (frames.current === 40) p.setScene(scene, camera)
    p.renderSample()
    window.__samples = Math.floor(p.samples)
    if (p.samples >= samples) window.__ready = true
  }, 1)
  return null
}

/** a product shot in the light studio: the tile floating over its soft shadow */
function StudioShot({ cam, rot, fit = 1, key = -0.4, at = -0.05 }: { cam: V3; rot: V3; fit?: number; key?: number; at?: number }) {
  const p = PRODUCTS.find((x) => x.design === design)!
  const sz = sizeById(p.size)
  const k = 1.6 / Math.max(sz.w, sz.h)
  const w = sz.w * k * fit
  const h = sz.h * k * fit
  return (
    <>
      <PerspectiveCamera makeDefault fov={28} position={cam} onUpdate={(c) => c.lookAt(0, at, 0)} />
      <Studio read={() => ({ dark: 0, key })} />
      <Slab design={design} finish={p.finish === 'Carving' ? 'Carving' : 'Glossy'} size={[w, h]} rotation={rot} />
      <ContactShadows position={[0, -h / 2 - 0.15, 0]} scale={Math.max(w, h) * 1.6} blur={2.4} far={1.3} opacity={0.5} color="#20201c" frames={1} />
    </>
  )
}

/** a design from the range in one colourway, in its line's hero format, in the light studio */
function PieceShot() {
  const d = designById(design)!
  const line = lineById(d.line)
  const cw = d.colourways.find((c) => c.slug === q.get('cw')) ?? d.colourways[0]
  const f = formatById(q.get('format') ?? line.hero)!
  const [w0, h0] = metres(f)
  const k = (1.6 * 0.92) / Math.max(w0, h0)
  const { uv, flip } = windowFor(d, f)
  const mm = line.thicknesses[Math.floor(line.thicknesses.length / 2)]
  return (
    <>
      <PerspectiveCamera makeDefault fov={28} position={[0.3, 0.15, 4.3]} onUpdate={(c) => c.lookAt(0, -0.12, 0)} />
      <Studio read={() => ({ dark: 0, key: 0.2 })} />
      <Slab
        face={faceOf(d, cw)}
        look={finishById(d.finish).look}
        uv={uv}
        flip={flip}
        size={[w0 * k, h0 * k]}
        depth={Math.max(0.009, (mm / 1000) * k)}
        rotation={[0.05, -0.36, 0.035]}
      />
      <ContactShadows position={[0, (-h0 * k) / 2 - 0.15, 0]} scale={1.6 * 1.6} blur={2.4} far={1.3} opacity={0.5} color="#20201c" frames={1} />
    </>
  )
}

/** a square sample of a design in one finish, tipped back so the light runs across it */
function FinishShot() {
  const d = designById(design)!
  const cw = d.colourways.find((c) => c.slug === q.get('cw')) ?? d.colourways[0]
  const f = formatById('800x800')!
  const { uv } = windowFor(d, f)
  const look = finishById((q.get('finish') ?? 'glossy') as never).look
  return (
    <>
      <PerspectiveCamera makeDefault fov={26} position={[0, 0.35, 3.1]} onUpdate={(c) => c.lookAt(0, 0, 0)} />
      <Studio read={() => ({ dark: Number(q.get('dark') ?? 0.72), key: Number(q.get('key') ?? -0.5) })} />
      {/* a low light from the side, grazing the face so relief finishes show their texture */}
      <directionalLight position={[-3.2, 0.25, 0.6]} intensity={1.6} color="#fff4e6" />
      <Slab face={faceOf(d, cw)} look={look} uv={uv} size={[1.1, 1.1]} depth={0.02} rotation={[-0.14, -0.3, 0]} />
      <ContactShadows position={[0, -0.62, 0]} scale={2.6} blur={2.4} far={1.2} opacity={0.4} color="#20201c" frames={1} />
    </>
  )
}

/**
 * One slab standing in the light studio at its true proportions and true
 * thickness, seen from a little below so it towers: &format=, &mm=, and the
 * turn &ry= (near ±1.5 it stands edge-on and shows how thin it is).
 */
function TallShot() {
  const d = designById(design)!
  const cw = d.colourways.find((c) => c.slug === q.get('cw')) ?? d.colourways[0]
  const f = formatById(q.get('format') ?? '1800x3600')!
  const [w0, h0] = metres(f)
  const k = 2.3 / h0
  const { uv, flip } = windowFor(d, f)
  const mm = Number(q.get('mm') ?? 12)
  const ry = Number(q.get('ry') ?? -0.32)
  return (
    <>
      <PerspectiveCamera makeDefault fov={Number(q.get('fov') ?? 27)} position={[0.2, -0.45, 6.2]} onUpdate={(c) => c.lookAt(0, 0.02, 0)} />
      <Studio read={() => ({ dark: Number(q.get('dark') ?? 0), key: Number(q.get('key') ?? 0.25) })} />
      <Slab
        face={faceOf(d, cw, true)}
        look={finishById((q.get('finish') ?? d.finish) as never).look}
        uv={uv}
        flip={flip}
        size={[w0 * k, h0 * k]}
        depth={(mm / 1000) * k}
        rotation={[0, ry, Number(q.get('rz') ?? 0)]}
      />
      <ContactShadows position={[0, -1.15 - 0.02, 0]} scale={3.2} blur={2.2} far={1.4} opacity={0.55} color="#20201c" frames={1} />
    </>
  )
}

const SCENES: Record<string, () => ReactNode> = {
  // a slab standing tall, for the showcase pages: &format=&mm=&ry=
  tall: () => <TallShot />,
  // a finish sample: &finish=specchio|glossy|satin|matt|carving|pelle|presa|grip
  finish: () => <FinishShot />,
  // a card for the range: any design, any colourway (&cw=slug)
  piece: () => <PieceShot />,
  // a card for the collection: the tile in its own proportions, a quarter turn to the light
  card: () => <StudioShot cam={[0.3, 0.15, 4.3]} rot={[0.05, -0.36, 0.035]} fit={0.92} key={Number(q.get('key') ?? 0.2)} at={-0.12} />,
  // the hero's opening frame, for visitors who prefer reduced motion
  'hero-light': () => <StudioShot cam={[0, 0, 5]} rot={[0.08, -0.62, 0.1]} fit={0.86} />,
  // the living room, path traced: lit through its window by a real sky and a low sun
  'room-pt': () => (
    <>
      <PerspectiveCamera makeDefault fov={52} position={[2.35, 1.28, 2.3]} onUpdate={(c) => c.lookAt(-0.7, 0.62, -1.05)} />
      <Sky intensity={1} />
      <directionalLight position={[-8, 5, 0.4]} intensity={2.2} color="#fff0d6" />
      <RoomContents design={design} tileMm={design === "nero" ? [600, 1200] : [800, 1600]} finish="Glossy" wall={false} grout={design === "nero" ? "dark" : "light"} layout="straight" light="day" trace />
      <PathTrace samples={Number(q.get('samples') ?? 400)} />
    </>
  ),
  // the living room, for the home page's reveal: Statuario on the floor, by day
  room: () => (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[2.05, 1.32, 4.35]} onUpdate={(c) => c.lookAt(-0.55, 0.62, -0.95)} />
      <RoomContents design={design} tileMm={[800, 1600]} finish="Glossy" wall={false} grout="light" layout="straight" light="day" />
    </>
  ),
  // the kiln: slabs riding a roller line into a glowing mouth
  kiln: () => {
    const cam: V3 = [3.2, 1.35, 3.4]
    return (
      <>
        <PerspectiveCamera makeDefault fov={32} position={cam} onUpdate={(c) => c.lookAt(-0.6, 0.55, -0.6)} />
        <Gallery ground={bg} fogNear={3} fogFar={11} spot={0.5} spotFrom={[2, 4.5, 2]} spotAt={[0.6, 0.6, 0.4]} fill={0.3} />
        {/* the roller line */}
        {Array.from({ length: 34 }, (_, i) => (
          <mesh key={i} position={[2.4 - i * 0.16, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 12]} />
            <meshStandardMaterial color="#8d918c" metalness={0.9} roughness={0.35} />
          </mesh>
        ))}
        {[-0.56, 0.56].map((z) => (
          <mesh key={z} position={[-0.3, 0.5, z]} castShadow>
            <boxGeometry args={[5.6, 0.2, 0.05]} />
            <meshStandardMaterial color="#232826" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        {['nero', 'statuario', 'calacatta'].map((d, i) => (
          <Slab key={d} design={d} position={[1.9 - i * 1.78, 0.66, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
        ))}
        {/* the kiln: a dark block with a glowing mouth */}
        <mesh position={[-3.2, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 2, 2.4]} />
          <meshStandardMaterial color="#1d2120" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[-2.09, 0.78, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.3, 0.34]} />
          <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
        </mesh>
        <pointLight position={[-1.8, 0.8, 0]} color="#ff6a1a" intensity={9} distance={4.5} decay={2} />
        <pointLight position={[-1.6, 0.7, 0]} color="#ffb070" intensity={3} distance={2.5} decay={2} />
      </>
    )
  },
  // a slab standing, turned a little to the light, on the polished floor
  portrait: () => {
    const cam: V3 = [1.1, 0.92, 3.4]
    const n = faceNormal(0, -0.36)
    const light = LIGHT_STONES.has(design)
    return (
      <>
        <PerspectiveCamera makeDefault fov={27} position={cam} onUpdate={(c) => c.lookAt(0, 0.8, 0)} />
        <Gallery
          ground={bg}
          fill={light ? 0.12 : 0.4}
          spot={light ? 0.75 : 1}
          spotAngle={0.3}
          spotFrom={[0.7, 4.4, 1.7]}
          spotAt={[0, 1.2, 0]}
          formers={[
            { position: mirrorLight(cam, [-0.14, 0.95, 0.05], n), scale: [0.4, 9, 1], intensity: light ? 3.2 : 2.2 },
            { position: mirrorLight(cam, [0.22, 1.5, -0.08], n), scale: [2.2, 0.9, 1], intensity: light ? 1.4 : 0.9 },
          ]}
        />
        <Slab design={design} finish={finish} position={[0, SLAB.h / 2 + 0.001, 0]} rotation={[0, -0.36, 0]} />
      </>
    )
  },
  // the showroom: slabs standing side by side in the dark, receding to the left
  row: () => {
    const designs = ['statuario', 'nero', 'onice', 'calacatta', 'travertino', 'armani', 'bardiglio']
    const cam: V3 = [2.6, 1.1, 3.6]
    const at: V3 = [-1.4, 0.85, -1.4]
    const slabs = designs.map((d, i) => {
      const x = 1.5 - i * 1.15
      const z = -i * 0.55
      return { d, x, z, ry: Math.atan2(cam[0] - x, cam[2] - z) - 0.6 }
    })
    return (
      <>
        <PerspectiveCamera makeDefault fov={36} position={cam} onUpdate={(c) => c.lookAt(...at)} />
        <Gallery
          ground={bg}
          fogNear={3.5}
          fogFar={11}
          spot={1.4}
          spotAngle={0.6}
          spotFrom={[0.5, 5.5, 2.5]}
          spotAt={[-0.6, 0.6, -1.2]}
          formers={[{ position: mirrorLight(cam, [slabs[1].x, 0.9, slabs[1].z], faceNormal(0, slabs[1].ry)), scale: [0.8, 10, 1], intensity: 1.8 }]}
        />
        {slabs.map((s) => (
          <Slab key={s.d} design={s.d} position={[s.x, SLAB.h / 2 + 0.001, s.z]} rotation={[0, s.ry, 0]} />
        ))}
      </>
    )
  },
  // slabs lying in a stack, seen low at their edges
  stack: () => {
    const designs = ['statuario', 'calacatta', 'nero', 'armani', 'travertino', 'onice', 'bardiglio', 'statuario', 'crema']
    return (
      <>
        <PerspectiveCamera makeDefault fov={30} position={[0.95, 0.36, 1.15]} onUpdate={(c) => c.lookAt(0.05, 0.07, 0.2)} />
        <Gallery ground={bg} fogNear={2} fogFar={6} spotAt={[0, 0.06, 0.2]} spotFrom={[1.6, 1.3, 2.4]} spotAngle={0.5} fill={0.25} />
        {designs.map((d, i) => (
          <Slab
            key={i}
            design={d}
            position={[(i % 3) * 0.006 - 0.006, SLAB.d / 2 + i * (SLAB.d + 0.0035) + 0.02, (i % 2) * 0.008]}
            rotation={[-Math.PI / 2, 0, (i % 4) * 0.004]}
          />
        ))}
        {/* the pallet boards under the stack */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.9, 0.02, 1.7]} />
          <meshStandardMaterial color="#2a2621" roughness={0.9} />
        </mesh>
      </>
    )
  },
  // a slab lying flat under a bar of light, from above
  polish: () => (
    <>
      <PerspectiveCamera makeDefault fov={32} position={[0.1, 1.15, 1.05]} onUpdate={(c) => c.lookAt(0, 0, 0.1)} />
      <Gallery
        ground={bg}
        floor={false}
        spot={0.6}
        spotAt={[0, 0, 0]}
        formers={[
          { position: mirrorLight([0.1, 1.15, 1.05], [0.05, 0, -0.1], [0, 1, 0]), scale: [9, 0.6, 1], intensity: 2.4 },
        ]}
      />
      <Slab design="nero" position={[0, SLAB.d / 2, 0]} rotation={[-Math.PI / 2, 0, 0.12]} />
    </>
  ),
  // an A-frame rack of finished slabs, staggered so each face shows
  rack: () => {
    const left = ['statuario', 'calacatta', 'bardiglio', 'armani']
    const right = ['nero', 'onice', 'travertino', 'crema']
    const lean = -0.1
    return (
      <>
        <PerspectiveCamera makeDefault fov={30} position={[2.5, 1.3, 3.1]} onUpdate={(c) => c.lookAt(0, 0.75, 0)} />
        <Gallery ground={bg} fogNear={4} fogFar={10} spotFrom={[1.2, 4.8, 2]} />
        {left.map((d, i) => (
          <Slab
            key={d}
            design={d}
            position={[-0.13 - i * 0.022, 0.8, 0.9 - i * 0.28]}
            rotation={[lean, -Math.PI / 2, 0, 'YXZ']}
          />
        ))}
        {right.map((d, i) => (
          <Slab
            key={d}
            design={d}
            position={[0.13 + i * 0.022, 0.8, 0.9 - i * 0.28]}
            rotation={[lean, Math.PI / 2, 0, 'YXZ']}
          />
        ))}
        {/* the steel A of the frame */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.08, 0.82, 0]} rotation={[0, 0, sx * 0.1]}>
            <boxGeometry args={[0.03, 1.66, 2.4]} />
            <meshStandardMaterial color="#1b1f1d" metalness={0.8} roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.9, 0.06, 2.5]} />
          <meshStandardMaterial color="#1b1f1d" metalness={0.8} roughness={0.45} />
        </mesh>
      </>
    )
  },
}

createRoot(document.getElementById('r')!).render(
  <Canvas
    shadows="percentage"
    dpr={1}
    gl={{ antialias: true }}
    onCreated={({ gl }) => {
      gl.toneMappingExposure = Number(q.get('exp') ?? 1)
    }}
  >
    <color attach="background" args={[bg]} />
    <Suspense fallback={null}>
      {SCENES[scene]()}
      {!scene.endsWith('-pt') && <Ready />}
    </Suspense>
  </Canvas>,
)
