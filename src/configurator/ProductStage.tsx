import { ContactShadows, Html, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { finishById, type Colourway, type FinishId, type Format, type RangeDesign } from '../data/range'
import { Slab, type FaceSrc } from '../three/Slab'
import { Studio } from '../three/Studio'
import { drawPattern, GROUT } from '../three/pattern'
import { faceOf, windowFor } from '../three/surface'
import { LIGHTS, type Grout, type LightId, type Pattern, type View } from './stage-config'

// The configurator's 3D stage. One canvas, five ways to look at a design:
// the slab itself (turn it, or see its edge), at scale beside a person and a
// door, bookmatched in pairs or fours, laid as a floor in a pattern with its
// grout, and two finishes side by side. Everything is in metres, at true size.


const FOV = 30

export interface StageProps {
  design: RangeDesign
  colourway: Colourway
  format: Format
  mm: number
  finish: FinishId
  view: View
  light: LightId
  raking: boolean
  face: number
  edge: boolean
  pattern: Pattern
  grout: Grout
  match: 2 | 4
  compare: FinishId
  /** the line's largest format: the slab view is framed for it, so smaller formats look smaller */
  fit: Format
}

export default function ProductStage(props: StageProps) {
  const L = LIGHTS[props.light]
  // the light eases between presets; raking swings the key round to graze the face
  const read = useRef({ dark: L.dark, key: L.key, warm: L.warm })
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows={false}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = props.light === 'day' ? 1.15 : 1.25
      }}
    >
      <PerspectiveCamera makeDefault fov={FOV} position={[0, 1.6, 8]} />
      <LightRig target={read} light={props.light} raking={props.raking} view={props.view} />
      <Studio read={() => read.current} />
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={props.view === 'laid' ? 0.35 : Math.PI * 0.32}
        maxPolarAngle={props.view === 'laid' ? 1.15 : Math.PI * 0.55}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
      />
    </Canvas>
  )
}

/** eases the studio towards the chosen light */
function LightRig({
  target,
  light,
  raking,
  view,
}: {
  target: React.RefObject<{ dark: number; key: number; warm: number }>
  light: LightId
  raking: boolean
  view: View
}) {
  useFrame((_, dt) => {
    const L = LIGHTS[light]
    // comparing finishes: the key sits where a polished face mirrors it and a matt one only glows
    const key = raking ? 1.25 : view === 'compare' ? 0.12 : view === 'laid' ? 0.6 : L.key
    const dark = raking ? Math.max(L.dark, 0.6) : view === 'laid' ? Math.max(L.dark, 0.35) : L.dark
    const goal = { dark, key, warm: L.warm }
    const c = target.current!
    const k = 1 - Math.exp(-dt * 4)
    c.dark += (goal.dark - c.dark) * k
    c.key += (goal.key - c.key) * k
    c.warm += (goal.warm - c.warm) * k
  })
  return null
}

/** moves the camera to frame a view whenever the framing changes, then leaves it to the visitor */
function CameraRig({ pos, look }: { pos: [number, number, number]; look: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null
  const settle = useRef(1)
  const key = pos.join() + look.join()
  useEffect(() => {
    settle.current = 1
  }, [key])
  useFrame((_, dt) => {
    if (settle.current <= 0.001 || !controls) return
    const k = 1 - Math.exp(-dt * 5)
    camera.position.lerp(new THREE.Vector3(...pos), k)
    controls.target.lerp(new THREE.Vector3(...look), k)
    controls.update()
    settle.current *= 1 - k
  })
  return null
}

/** distance at which a box of height h and width w fills the frame, with a margin */
function fitDistance(w: number, h: number, aspect: number, margin = 1.3) {
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  return Math.max((h * margin) / 2 / t, (w * margin) / 2 / (t * aspect))
}

function Scene(p: StageProps) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const face = faceOf(p.design, p.colourway, true)
  const look = finishById(p.finish).look
  const w = p.format.w / 1000
  const h = p.format.h / 1000
  const depth = p.mm / 1000
  const { uv, flip } = windowFor(p.design, p.format, p.face)

  if (p.view === 'laid') return <Laid {...p} src={face} aspect={aspect} />

  if (p.view === 'pair') {
    const n = p.match
    const cols = 2
    const rows = n === 4 ? 2 : 1
    const j = 0.004
    const W = cols * w + j
    const H = rows * h + (rows - 1) * j
    const d = fitDistance(W, H, aspect, 1.22)
    const pieces: { x: number; y: number; fl: [boolean, boolean] }[] = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        pieces.push({ x: (c - 0.5) * (w + j), y: h / 2 + (rows - 1 - r) * (h + j), fl: [c === 1, r === 1] })
    return (
      <>
        <CameraRig pos={[0, H / 2, d]} look={[0, H / 2, 0]} />
        {pieces.map((s, i) => (
          <Slab key={i} face={face} look={look} uv={windowFor(p.design, p.format, 0).uv} flip={s.fl} size={[w, h]} depth={depth} position={[s.x, s.y, 0]} fade={0.6} />
        ))}
        <Dim from={[-W / 2, -0.06, 0.02]} to={[W / 2, -0.06, 0.02]} label={`${p.format.w * 2 + 4} mm`} />
        <ContactShadows position={[0, 0, 0]} scale={Math.max(W, 2) * 1.6} blur={2.6} far={1.2} opacity={0.35} color="#20201c" />
      </>
    )
  }

  if (p.view === 'compare') {
    const gap = Math.max(0.25, w * 0.2)
    const W = 2 * w + gap
    const d = fitDistance(W, h, aspect, 1.3)
    const two: [FinishId, number][] = [
      [p.finish, -(w + gap) / 2],
      [p.compare, (w + gap) / 2],
    ]
    return (
      <>
        <CameraRig pos={[0, h / 2, d]} look={[0, h / 2, 0]} />
        {two.map(([f, x]) => (
          <group key={f + x} position={[x, h / 2, 0]}>
            <Slab face={face} look={finishById(f).look} uv={uv} flip={flip} size={[w, h]} depth={depth} rotation={[0, x < 0 ? 0.18 : -0.18, 0]} fade={0.6} />
            <Html position={[0, -h / 2 - 0.12, 0]} center className="ps-label">
              {finishById(f).name}
            </Html>
          </group>
        ))}
        <ContactShadows position={[0, 0, 0]} scale={W * 1.6} blur={2.6} far={1.2} opacity={0.38} color="#20201c" />
      </>
    )
  }

  // the slab, and at scale beside a person and a door
  const scale = p.view === 'scale'
  const fw = p.fit.w / 1000
  const fh = p.fit.h / 1000
  const frameW = scale ? fw + 3.2 : Math.max(fw, 0.9)
  const frameH = scale ? Math.max(fh, 2.1) : fh
  const d = fitDistance(frameW, frameH, aspect, scale ? 1.18 : 1.22)
  return (
    <>
      <CameraRig pos={[scale ? 0 : 0.6, frameH * 0.47, d]} look={[0, frameH * 0.43, 0]} />
      <Turning edge={p.edge} y={h / 2 + 0.002}>
        <Slab face={face} look={look} uv={uv} flip={flip} size={[w, h]} depth={depth} fade={0.7} />
      </Turning>
      <Dim from={[-w / 2, -0.06, 0.05]} to={[w / 2, -0.06, 0.05]} label={`${p.format.w} mm`} />
      <Dim from={[w / 2 + 0.08, 0, 0.05]} to={[w / 2 + 0.08, h, 0.05]} label={`${p.format.h} mm`} vertical />
      {p.edge && (
        <Html position={[0, h + 0.12, 0]} center className="ps-label">
          {p.mm} mm
        </Html>
      )}
      {scale && <ScaleSet slabW={w} />}
      <ContactShadows position={[0, 0, 0]} scale={Math.max(frameW, 2) * 1.5} blur={2.6} far={1.4} opacity={0.4} color="#20201c" />
    </>
  )
}

/** turns its child to show the face, or swings it nearly edge-on */
function Turning({ edge, y, children }: { edge: boolean; y: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!g.current) return
    const goal = edge ? 1.42 : -0.3
    g.current.rotation.y += (goal - g.current.rotation.y) * (1 - Math.exp(-dt * 3.2))
  })
  return (
    <group ref={g} position-y={y} rotation-y={-0.3}>
      {children}
    </group>
  )
}

/** a dimension line with a label */
function Dim({ from, to, label, vertical = false }: { from: [number, number, number]; to: [number, number, number]; label: string; vertical?: boolean }) {
  const k = [...from, ...to].join()
  const geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from[0], from[1], from[2]), new THREE.Vector3(to[0], to[1], to[2])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [k],
  )
  useEffect(() => () => geo.dispose(), [geo])
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  return (
    <>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#6a6a6e" />
      </lineSegments>
      <Html position={[mid[0] + (vertical ? 0.1 : 0), mid[1] - (vertical ? 0 : 0.08), mid[2]]} center className={`ps-dim${vertical ? ' is-v' : ''}`}>
        {label}
      </Html>
    </>
  )
}

/** a 1.75 m figure, a 2.1 m door and a 1 m rule, so the slab reads at its true size */
function ScaleSet({ slabW }: { slabW: number }) {
  const mat = <meshStandardMaterial color="#cfcfca" roughness={0.9} />
  const x0 = -(slabW / 2 + 0.75)
  const x1 = slabW / 2 + 0.95
  return (
    <>
      <group position={[x0, 0, 0.1]}>
        <mesh position={[0, 0.78, 0]}>
          <capsuleGeometry args={[0.17, 1.02, 8, 24]} />
          {mat}
        </mesh>
        <mesh position={[0, 1.63, 0]}>
          <sphereGeometry args={[0.115, 24, 16]} />
          {mat}
        </mesh>
        <Html position={[0, 1.88, 0]} center className="ps-label">
          1.75 m
        </Html>
      </group>
      <group position={[x1, 0, 0]}>
        {[
          [-0.475, 1.075, 0.05, 2.15],
          [0.475, 1.075, 0.05, 2.15],
          [0, 2.125, 1.0, 0.05],
        ].map(([x, y, bw, bh], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[bw, bh, 0.12]} />
            <meshStandardMaterial color="#bdbdb7" roughness={0.8} />
          </mesh>
        ))}
        <Html position={[0, 2.35, 0]} center className="ps-label">
          Door, 2.1 m
        </Html>
      </group>
      <group position={[x0 - 0.1, 0.01, 0.6]}>
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[1, 0.02, 0.04]} />
          <meshStandardMaterial color="#0b0b0c" />
        </mesh>
        <Html position={[0.5, 0.1, 0]} center className="ps-label">
          1 m
        </Html>
      </group>
    </>
  )
}

// ---------------------------------------------------------------- laid

/**
 * A floor laid in the chosen format and pattern, drawn piece by piece onto a
 * canvas at true scale (each piece a different window of the stone, as the
 * faces in a crate differ), with the grout showing between, then lit with
 * the finish's physics.
 */
function Laid(p: StageProps & { src: FaceSrc; aspect: number }) {
  const tex = useTexture(p.src.map)
  const img = tex.image as CanvasImageSource & { width: number; height: number }
  const fw = p.format.w / 1000
  const fh = p.format.h / 1000
  const A = Math.min(9, Math.max(3.6, fh * 2.4))
  const canvasTex = useMemo(() => {
    const px = 2048
    const ppm = px / A
    const c = document.createElement('canvas')
    c.width = c.height = px
    const ctx = c.getContext('2d')!
    ctx.fillStyle = GROUT[p.grout.tone]
    ctx.fillRect(0, 0, px, px)
    // joints drawn at true width, but never thinner than a visible hairline
    drawPattern(ctx, img, p.design, p.format, p.pattern, Math.max(2.5, (p.grout.mm / 1000) * ppm * 2.2), ppm, px)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [img, p.design, p.format, p.pattern, p.grout.tone, p.grout.mm, A])
  useEffect(() => () => canvasTex.dispose(), [canvasTex])
  const look = finishById(p.finish).look
  const d = fitDistance(A, A * 0.5, p.aspect, 0.8)
  return (
    <>
      <CameraRig pos={[0, d * 0.42, d * 0.72]} look={[0, 0, -A * 0.08]} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[A, A]} />
        <meshPhysicalMaterial map={canvasTex} roughness={look.roughness} clearcoat={look.clearcoat} clearcoatRoughness={look.clearcoatRoughness} />
      </mesh>
      <Html position={[0, 0.02, A / 2 + 0.25]} center className="ps-label">
        {`${(A).toFixed(1)} × ${(A).toFixed(1)} m · ${p.format.w} × ${p.format.h} mm · ${fw * fh >= 1 ? 'slabs' : 'tiles'}`}
      </Html>
    </>
  )
}

