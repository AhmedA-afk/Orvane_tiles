import { ContactShadows, PerspectiveCamera, useFBO, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { productById, sizeById } from '../data/catalog'
import { designById, formatById, LINES, lineById } from '../data/range'
import { Slab, preloadDesign, type FaceSrc } from '../three/Slab'
import { Studio } from '../three/Studio'
import room from './room.json'
import { D, follow, pointer, ROOM_STONE, ROOM_TILE, snap, useLook, type Pose } from './store'

// The home page's single 3D stage: one porcelain slab that performs the whole
// page. It reads its pose from the film (`D`) in screen terms, so "two thirds
// across, 64% of the screen tall" holds at any size, and eases towards it.

const FOV = 30
const CAM_Z = 5
const VH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) // world height visible at z = 0
const SLAB_H = 1.6
const KEYS = Object.keys(D) as (keyof Pose)[]
/** wide screens get the full-resolution faces for the close-up that fills the screen */
const HD = typeof window !== 'undefined' && window.innerWidth >= 900

/** the eased pose the stage actually draws */
const C: Pose = { ...D }

function useEase() {
  useFrame((_, dt) => {
    if (snap.now) {
      Object.assign(C, D)
      snap.now = false
      return
    }
    const step = Math.min(dt, 1 / 20)
    for (const k of KEYS) C[k] = THREE.MathUtils.damp(C[k], D[k], 6.5, step)
  })
}

/** a design in its line's hero format, its long side 1.6 m like the slab's */
function sizeFor(design: string): [number, number] {
  const d = designById(design)
  if (!d) return [0.8, 1.6]
  const { w, h } = formatById(lineById(d.line).hero)!
  const k = 1.6 / Math.max(w, h)
  return [w * k, h * k]
}

/** the room's stone: the tile with its face and shape on the wall, then the same stone as a slab */
const ROOM: Record<string, { face: FaceSrc; size: [number, number] }> = {
  [ROOM_TILE]: { face: { map: '/renders/home/tile.jpg' }, size: [(SLAB_H * room.tile.w) / room.tile.h, SLAB_H] },
  [ROOM_STONE]: { face: { map: '/renders/home/slab.jpg' }, size: [SLAB_H / 2, SLAB_H] },
}

function Protagonist() {
  const { design, finish } = useLook()
  const own = ROOM[design]
  const size = useMemo(() => own?.size ?? sizeFor(design), [own, design])
  const group = useRef<THREE.Group>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const shadow = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const vw = VH * aspect
    const f = C.float
    const bob = Math.sin(t * 0.9) * 0.025 * f
    g.position.set((C.sx * vw) / 2, (C.sy * VH) / 2 + bob, 0)
    const s = (C.h * VH) / SLAB_H
    g.scale.setScalar(s)
    const lean = pointer.active ? 1 : 0
    g.rotation.set(
      C.rx - pointer.y * 0.07 * f * lean + Math.sin(t * 0.6) * 0.01 * f,
      C.ry + pointer.x * 0.2 * f * lean,
      C.rz + Math.sin(t * 0.5) * 0.012 * f,
    )
    g.visible = C.vis > 0.01
    // the flat tile in the page sits exactly over the slab, until it hands over
    const el = follow.el
    if (el) {
      const { width: W, height: H } = state.size
      const hp = (C.h * H * size[1]) / SLAB_H
      const wp = (hp * size[0]) / size[1]
      el.style.transform = `translate(${((1 + C.sx) * W - wp) / 2}px, ${((1 - C.sy) * H - hp) / 2}px)`
      el.style.width = `${wp}px`
      el.style.height = `${hp}px`
    }
    if (shadow.current) {
      shadow.current.position.set(g.position.x, g.position.y - (s * SLAB_H) / 2 - 0.18 - bob, 0)
      shadow.current.scale.setScalar(Math.max(0.6, s * 1.3))
      shadow.current.visible = C.shadow * (1 - C.dark) > 0.02
    }
  })

  return (
    <>
      <group ref={group}>
        <Slab design={own ? 'calacatta' : design} face={own?.face} finish={finish} fade={0.9} size={size} hd={HD} />
      </group>
      <group ref={shadow}>
        <ContactShadows frames={Infinity} resolution={512} scale={2.2} blur={2.8} far={1.4} opacity={0.42} color="#20201c" />
      </group>
    </>
  )
}

/**
 * A jeweller's loupe that follows the pointer across the slab. A second camera
 * looks at the stone under the pointer through a field of view ZOOM times
 * narrower than the disc covers and renders it into a texture; the loupe shows
 * that texture inside a polished rim, so the veins are truly magnified.
 */
const ZOOM = 2
const LOUPE_Z = 0.6
function Loupe() {
  const group = useRef<THREE.Group>(null)
  const disc = useRef<THREE.Mesh>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const fbo = useFBO(768, 768, { type: THREE.HalfFloatType })
  const eye = useMemo(() => new THREE.PerspectiveCamera(FOV / ZOOM, 1, 0.1, 100), [])
  const at = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    const g = group.current
    if (!g) return
    const on = C.lens
    g.visible = on > 0.02
    if (!g.visible) return
    // the pointer's spot on the stone; the loupe hovers in front, centred on it
    const vw = VH * aspect
    const near = (CAM_Z - LOUPE_Z) / CAM_Z
    const tx = pointer.active ? (pointer.x * vw) / 2 : vw * 0.14
    const ty = pointer.active ? (pointer.y * VH) / 2 : VH * 0.04
    g.position.x = THREE.MathUtils.lerp(g.position.x, tx * near, 0.22)
    g.position.y = THREE.MathUtils.lerp(g.position.y, ty * near, 0.22)
    g.position.z = LOUPE_Z
    const r = 0.36 * (0.6 + 0.4 * on)
    g.scale.setScalar(r)
    // the eye sees a patch of stone ZOOM times smaller than the disc covers on screen
    at.set(g.position.x / near, g.position.y / near, 0)
    eye.position.copy(state.camera.position)
    eye.lookAt(at)
    eye.fov = THREE.MathUtils.radToDeg(2 * Math.atan(r / near / ZOOM / at.distanceTo(eye.position)))
    eye.aspect = 1
    eye.updateProjectionMatrix()
    g.visible = false
    state.gl.setRenderTarget(fbo)
    state.gl.clear()
    state.gl.render(state.scene, eye)
    state.gl.setRenderTarget(null)
    g.visible = true
    const m = disc.current?.material as THREE.MeshBasicMaterial | undefined
    if (m) m.opacity = Math.min(1, on * 1.4)
  })
  return (
    <group ref={group} visible={false}>
      <mesh ref={disc}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial map={fbo.texture} transparent />
      </mesh>
      {/* the rim: polished steel that catches the studio's lights */}
      <mesh>
        <torusGeometry args={[1.02, 0.045, 32, 128]} />
        <meshStandardMaterial color="#e8e8e8" metalness={1} roughness={0.12} />
      </mesh>
      {/* a sliver of glass over the disc, for its highlight */}
      <mesh position-z={0.02}>
        <circleGeometry args={[1, 96]} />
        <meshPhysicalMaterial transparent opacity={0.05} roughness={0} clearcoat={1} color="#ffffff" />
      </mesh>
    </group>
  )
}

/** the finale: four sample tiles fan out where the slab stood */
const SAMPLES = ['calacatta-6012', 'nero-6012', 'onice-8016', 'travertino-6012']
function SampleFan() {
  const group = useRef<THREE.Group>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const items = useRef<(THREE.Group | null)[]>([])
  useFrame((state) => {
    const g = group.current
    if (!g) return
    const k = C.fan
    g.visible = k > 0.01
    const vw = VH * aspect
    // beside the words on a wide screen; on a phone, smaller and closer, in the lower third under them
    const wide = aspect > 1
    g.position.set(wide ? vw * 0.2 : 0, (wide ? -0.05 : -0.29 * VH) + C.lift * VH, 0)
    const t = state.clock.elapsedTime
    const fit = wide ? 1 : 0.8
    items.current.forEach((m, i) => {
      if (!m) return
      const spread = (i - 1.5) * (wide ? 0.36 : 0.25) * k
      m.position.set(spread, Math.sin(t * 0.8 + i) * 0.02 + (1 - k) * -0.4, i * 0.02)
      m.rotation.set(0.05, -0.35 + (i - 1.5) * 0.1 * k, (i - 1.5) * -0.12 * k)
      m.scale.setScalar((0.85 + 0.15 * k) * fit)
    })
  })
  return (
    <group ref={group} visible={false}>
      {SAMPLES.map((id, i) => {
        const p = productById(id)!
        const s = sizeById('300x600')
        return (
          <group key={id} ref={(el) => void (items.current[i] = el)}>
            <Slab design={p.design} size={[s.w / 1000 * 1.25, s.h / 1000 * 1.25]} finish={p.finish === 'Carving' ? 'Carving' : 'Glossy'} />
          </group>
        )
      })}
    </group>
  )
}

function Frame() {
  useEase()
  return null
}

export default function Stage({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    Object.values(ROOM).forEach((r) => useTexture.preload(r.face.map))
    ;['calacatta', 'nero', ...LINES.map((l) => l.feature)].forEach((d) => preloadDesign(d, HD))
  }, [])
  return (
    <Canvas
      className="stage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.15
      }}
    >
      <PerspectiveCamera makeDefault fov={FOV} position={[0, 0, CAM_Z]} />
      <Frame />
      <Suspense fallback={null}>
        <Studio read={() => C} />
        <Protagonist />
        <SampleFan />
        <Loupe />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))
    return () => cancelAnimationFrame(id)
  }, [onReady])
  return null
}
