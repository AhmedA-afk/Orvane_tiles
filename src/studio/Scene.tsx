import { Environment, Lightformer, MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { designById, finishById, formatById } from '../data/range'
import { drawPattern, GROUT, groutFor } from '../three/pattern'
import { faceOf } from '../three/surface'
import { MOODS, type MoodId, type RoomDef, type SurfaceDef, type WeatherId } from './rooms'
import { Furniture } from './rooms3d'
import type { Lay } from './state'
import { lightAt, weathered, type Light } from './sun'
import { Snapshot, type SnapshotJob } from './Snapshot'
import { Walk } from './Walk'

// Orvane Studio, live. Any of the rooms, built from its data: a box with its
// glass to the west, the surfaces a visitor lays (each piece at true scale,
// in the chosen stone, format, pattern and finish), its furniture, and the
// sea and sky outside. The hour sets the sun (its angle through the glass,
// its colour, its shadows), the sky and the sea; the weather can hide the
// sun; the mood sets the lamps, which come up as the day goes.

export interface SceneProps {
  room: RoomDef
  surfaces: SurfaceDef[]
  lays: Record<string, Lay>
  hour: number
  mood: MoodId
  weather: WeatherId
  view: string
  /** changes each time a view chip is pressed, so the same view can be returned to */
  viewKey: number
  onPick: (surface: string) => void
  snapshot: SnapshotJob | null
  onSnapshot: (url: string | null, progress: number) => void
  onReady?: () => void
  quality: 'high' | 'low'
}

/** the light of the moment: the hour, under the weather, with the lamps set by the mood */
export function lightFor(hour: number, weather: WeatherId, mood: MoodId) {
  const L = weathered(lightAt(hour), weather)
  const M = MOODS.find((x) => x.id === mood)!
  // the gallery mood keeps its spots up even by day, as a showroom would
  const lamps = M.level === 0 ? 0 : Math.min(1.6, (mood === 'gallery' ? Math.max(L.lamps, 0.55) : L.lamps) * M.level)
  return { ...L, lamps, warm: M.color }
}

/* ------------------------------------------------------------------ laid surfaces */

/**
 * A plane laid at true scale onto canvases (colour, and relief where the
 * finish has it), the pieces' long side along the canvas's x. A wall's slabs
 * stand upright, so its canvas is drawn on its side and turned a quarter.
 */
function useLaid(lay: Lay, size: [number, number], upright: boolean, ppm: number) {
  const d = designById(lay.design)!
  const cw = d.colourways.find((c) => c.slug === lay.colourway) ?? d.colourways[0]
  const f = formatById(lay.format)!
  const look = finishById(lay.finish).look
  const face = faceOf(d, cw)
  const relief = look.relief >= 0.25 && !!face.normal
  const [map, nrm] = useTexture(relief ? [face.map, face.normal!] : [face.map, face.map])
  const [sa, sb] = size
  const tex = useMemo(() => {
    const [a, b] = upright ? [sb, sa] : [sa, sb]
    // a small surface is drawn finer, so a vanity top is as sharp as a floor
    const k = Math.min(2.2, Math.max(1, 6 / Math.max(a, b)))
    const ppmK = Math.min(ppm * k, 4096 / Math.max(a, b))
    const cwPx = Math.max(16, Math.round(a * ppmK))
    const chPx = Math.max(16, Math.round(b * ppmK))
    const joint = Math.max(1.6, 2 * (ppmK / 1000) * 1.6)
    const paint = (img: CanvasImageSource & { width: number; height: number }, ground: string) => {
      const c = document.createElement('canvas')
      c.width = cwPx
      c.height = chPx
      const g = c.getContext('2d')!
      g.fillStyle = ground
      g.fillRect(0, 0, cwPx, chPx)
      drawPattern(g, img, d, f, lay.pattern, joint, ppmK, Math.max(cwPx, chPx))
      const t = new THREE.CanvasTexture(c)
      t.anisotropy = 8
      if (upright) {
        t.center.set(0.5, 0.5)
        t.rotation = Math.PI / 2
      }
      return t
    }
    const colour = paint(map.image as never, GROUT[groutFor(cw.family)])
    colour.colorSpace = THREE.SRGBColorSpace
    const normal = relief ? paint(nrm.image as never, '#8080ff') : null
    return { colour, normal }
  }, [map, nrm, relief, d, f, lay.pattern, cw.family, sa, sb, upright, ppm])
  useEffect(
    () => () => {
      tex.colour.dispose()
      tex.normal?.dispose()
    },
    [tex],
  )
  return { ...tex, look, relief }
}

function LaidMaterial({
  lay,
  size,
  upright = false,
  ppm,
  mirror = false,
  glow = 0,
  trace,
}: {
  lay: Lay
  size: [number, number]
  upright?: boolean
  ppm: number
  mirror?: boolean
  /** light from behind a translucent stone, 0 to 1 */
  glow?: number
  trace: boolean
}) {
  const { colour, normal, look, relief } = useLaid(lay, size, upright, ppm)
  const ns = useMemo(() => new THREE.Vector2(look.relief * 1.4, look.relief * 1.4), [look.relief])
  // a polished floor mirrors the room for real; everything else reflects the sky's light
  if (mirror && look.roughness < 0.16 && !trace)
    return (
      <MeshReflectorMaterial
        map={colour}
        roughness={look.roughness + 0.03}
        metalness={0}
        blur={[160, 50]}
        resolution={1024}
        mixBlur={0.6}
        mixStrength={look.roughness < 0.06 ? 2.2 : 1.5}
        mixContrast={1}
        mirror={0.6}
        depthScale={0.35}
        minDepthThreshold={0.6}
        maxDepthThreshold={1.3}
      />
    )
  const emissive = glow > 0.01 ? { emissive: new THREE.Color('#ffe6c4'), emissiveMap: colour, emissiveIntensity: glow * 0.85 } : {}
  // the path tracer is given the polish as a smooth, plain surface: its clear coat turns these faces black
  if (trace) return <meshStandardMaterial map={colour} roughness={Math.max(0.06, look.roughness)} metalness={0} {...emissive} />
  return (
    <meshPhysicalMaterial
      map={colour}
      normalMap={relief ? (normal ?? undefined) : undefined}
      normalScale={ns}
      roughness={look.roughness}
      clearcoat={look.clearcoat}
      clearcoatRoughness={look.clearcoatRoughness}
      {...emissive}
    />
  )
}

function Surfaces({
  surfaces,
  lays,
  quality,
  trace,
  glow,
  walkables,
  onPick,
}: {
  surfaces: SurfaceDef[]
  lays: Record<string, Lay>
  quality: 'high' | 'low'
  trace: boolean
  glow: number
  walkables: RefObject<THREE.Object3D[]>
  onPick: (s: string) => void
}) {
  const ppm = quality === 'high' ? 470 : 250
  const group = useRef<THREE.Group>(null)
  useEffect(() => {
    const list: THREE.Object3D[] = []
    group.current?.traverse((o) => o.name === 'walk' && list.push(o))
    walkables.current = list
  }, [walkables, surfaces])
  return (
    <group ref={group}>
      {surfaces.map((s) =>
        s.planes.map((p, i) => {
          // a big floor is drawn a little coarser, so it fits on the card
          const k = Math.min(1, 9 / Math.max(...p.size))
          return (
            <mesh
              key={`${s.id}${i}`}
              name={s.kind === 'floor' || s.kind === 'outdoor' ? 'walk' : s.id}
              position={p.at}
              rotation={p.rot}
              receiveShadow
              castShadow={s.kind === 'top'}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onPick(s.id)
              }}
            >
              <planeGeometry args={p.size} />
              <Suspense fallback={<meshStandardMaterial color="#d9d4ca" />}>
                <LaidMaterial
                  lay={lays[s.id]}
                  size={p.size}
                  upright={s.upright}
                  ppm={ppm * k * (s.kind === 'outdoor' ? 0.8 : 1)}
                  mirror={s.mirror && i === 0}
                  glow={s.backlit ? glow : 0}
                  trace={trace}
                />
              </Suspense>
            </mesh>
          )
        }),
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ the shell */

const PLASTER = '#ebe7df'
const FRAME = '#2a2622'

/** the glass wall to the west: slim bronze frames and barely-there glass */
function Glazing({ room }: { room: RoomDef }) {
  const { w, d, h } = room
  const x = -w / 2
  const n = Math.max(2, Math.round(d / 1.6))
  const frame = <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.6} />
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => -d / 2 + (i * d) / n).map((z) => (
        <mesh key={z} position={[x, h / 2, z]} castShadow>
          <boxGeometry args={[0.07, h, 0.06]} />
          {frame}
        </mesh>
      ))}
      {[0.02, h - 0.04].map((y) => (
        <mesh key={y} position={[x, y, 0]} castShadow>
          <boxGeometry args={[0.08, 0.06, d]} />
          {frame}
        </mesh>
      ))}
      <mesh position={[x, h / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[d, h]} />
        <meshPhysicalMaterial color="#dfe9ec" transparent opacity={0.06} roughness={0.02} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Shell({ room, overhead, day }: { room: RoomDef; overhead: boolean; day: number }) {
  const { w, d, h, terrace: T } = room
  const open = h === 0
  const balustradeX = -w / 2 - T
  // the pool's balustrade leaves a gap where the water meets the sea
  const rails: [number, number][] = room.id === 'pool' ? [[-d / 2, -1.8], [1.8, d / 2]] : [[-d / 2, d / 2]]
  return (
    <group>
      {!open && (
        <>
          {/* the ceiling (carried out over a terrace as a deep roof), lifted off for the plan */}
          <group visible={!overhead}>
            {/* faces down only: the sun never reaches its underside, so it takes no shadow */}
            <mesh position={[-T / 2 + (T ? 0.6 : 0), h, 0]} rotation-x={Math.PI / 2}>
              <planeGeometry args={[w + T - (T ? 1.2 : 0), d]} />
              <meshStandardMaterial color="#f3f0ea" roughness={1} emissive="#f3f0ea" emissiveIntensity={0.05 + 0.42 * day} />
            </mesh>
            {/* the slab sits 3 cm above the ceiling so their faces never fight */}
            <mesh position={[-T / 2 + (T ? 0.6 : 0), h + 0.18, 0]} castShadow>
              <boxGeometry args={[w + T - (T ? 1.2 : 0), 0.3, d + 0.2]} />
              <meshStandardMaterial color="#d8d3ca" roughness={0.9} />
            </mesh>
          </group>
          {/* the plaster walls: east, north behind the stone, and south */}
          <mesh position={[w / 2, h / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[d, h]} />
            <meshStandardMaterial color={PLASTER} roughness={0.93} />
          </mesh>
          <mesh position={[0, h / 2, -d / 2 - 0.1]} castShadow receiveShadow>
            <boxGeometry args={[w, h + 0.3, 0.2]} />
            <meshStandardMaterial color={PLASTER} roughness={0.93} />
          </mesh>
          <mesh position={[0, h / 2, d / 2 + 0.1]} castShadow receiveShadow>
            <boxGeometry args={[w, h + 0.3, 0.2]} />
            <meshStandardMaterial color={PLASTER} roughness={0.93} />
          </mesh>
          <Glazing room={room} />
        </>
      )}
      {(T > 0 || open) &&
        rails.map(([a, b]) => (
          <group key={a}>
            <mesh position={[balustradeX, 0.55, (a + b) / 2]} rotation-y={Math.PI / 2}>
              <planeGeometry args={[b - a, 1.1]} />
              <meshPhysicalMaterial color="#dfe9ec" transparent opacity={0.12} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[balustradeX, 1.12, (a + b) / 2]}>
              <boxGeometry args={[0.05, 0.04, b - a]} />
              <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.6} />
            </mesh>
          </group>
        ))}
      {/* the cliff the house stands on, its top just under the floor */}
      <mesh position={[-T / 2, -3.03, 0]}>
        <boxGeometry args={[w + T, 6, d + 0.4]} />
        <meshStandardMaterial color="#a89e8f" roughness={1} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ outside */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`
const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunColor;
  uniform float uGlow;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float t = pow(smoothstep(-0.03, 0.85, d.y), 0.6);
    vec3 c = mix(uHorizon, uZenith, t);
    float s = max(dot(d, normalize(uSun)), 0.0);
    c += uSunColor * uGlow * (pow(s, 1400.0) * 8.0 + pow(s, 18.0) * 0.35 + pow(s, 4.0) * 0.08);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/** the sky: a dome shaded from the horizon to the zenith in the hour's colours, with the sun in it */
function SkyDome({ L, sun }: { L: Light; sun: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3() },
          uSunColor: { value: new THREE.Color() },
          uGlow: { value: 1 },
        },
      }),
    [],
  )
  mat.uniforms.uZenith.value.set(L.zenith)
  mat.uniforms.uHorizon.value.set(L.horizon)
  mat.uniforms.uSun.value.set(...L.dir)
  mat.uniforms.uSunColor.value.set(L.sunColor)
  mat.uniforms.uGlow.value = THREE.MathUtils.smoothstep(L.elevation, -6, 2) * sun
  return (
    <mesh material={mat} scale={1200} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 24]} />
    </mesh>
  )
}

/** rain: streaks falling past the glass and over the sea */
function Rain({ room }: { room: RoomDef }) {
  const N = 1600
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(N * 6)
    for (let i = 0; i < N; i++) {
      const x = -room.w / 2 - room.terrace - 0.3 - Math.random() * 26
      const y = Math.random() * 14 - 2
      const z = (Math.random() - 0.5) * (room.d + 30)
      p.set([x, y, z, x + 0.02, y - 0.35, z], i * 6)
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [room])
  useFrame(({ invalidate }, dt) => {
    // the canvas only draws on demand; falling rain asks for the next frame
    invalidate()
    const a = geo.attributes.position as THREE.BufferAttribute
    const p = a.array as Float32Array
    const fall = dt * 9
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] -= fall
      if (i % 6 === 3 && p[i + 1] < -2) {
        p[i - 2] += 14
        p[i + 1] += 14
      }
    }
    a.needsUpdate = true
  })
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#c9d1d8" transparent opacity={0.32} />
    </lineSegments>
  )
}

function Outside({ L, weather, room }: { L: Light; weather: WeatherId; room: RoomDef }) {
  return (
    <>
      <SkyDome L={L} sun={weather === 'clear' ? 1 : 0.08} />
      <mesh position={[-80, -6, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color={L.sea} roughness={0.3} metalness={0} envMapIntensity={0.35} />
      </mesh>
      {weather === 'rain' && <Rain room={room} />}
    </>
  )
}

/* ------------------------------------------------------------------ light */

function Lights({ L, room, quality }: { L: ReturnType<typeof lightFor>; room: RoomDef; quality: 'high' | 'low' }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const { gl, scene } = useThree()
  useEffect(() => {
    gl.toneMappingExposure = L.exposure
  }, [gl, L.exposure])
  useEffect(() => {
    scene.background = new THREE.Color(L.night)
  }, [scene, L.night])
  useEffect(() => {
    if (sun.current) scene.add(sun.current.target)
  }, [scene])
  const { w, d, h } = room
  // rebuilt in steps (every few degrees of sun, a tenth of daylight or lamp), so a day played through stays smooth
  const envKey = `${Math.round(L.elevation / 4)}|${Math.round(L.day * 10)}|${Math.round(L.lamps * 10)}|${L.warm}|${Math.round(L.sunIntensity)}`
  const span = Math.max(w + room.terrace, d) / 2 + 3
  const lamp = L.lamps
  const ceiling = h || 3
  return (
    <>
      {/* drawn once for each change of light, not every frame: rebuilding it each frame made the room stutter */}
      <Environment key={envKey} resolution={128} frames={1} environmentIntensity={0.35 + 1.05 * L.day}>
        <color attach="background" args={[L.night]} />
        {/* the sky through the glass, the ceiling's bounce, the room behind */}
        <Lightformer form="rect" intensity={0.3 + 6 * L.day} color={L.skyColor} position={[-w / 2 - 5, 2, 0]} rotation-y={Math.PI / 2} scale={[d + 2, 4, 1]} />
        <Lightformer form="rect" intensity={1.1 * L.day} color="#f4ede2" position={[0, ceiling + 3, 0]} rotation-x={Math.PI / 2} scale={[w + 3, d + 2, 1]} />
        <Lightformer form="rect" intensity={0.6 * L.day} color="#efe6d8" position={[w / 2 + 1, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[d, 3, 1]} />
        {lamp > 0.02 && <Lightformer form="circle" intensity={3 * lamp} color={L.warm} position={[0, ceiling - 0.6, 0]} scale={1.2} />}
      </Environment>
      <hemisphereLight args={[L.skyColor, '#8a7a66', 0.2 + 0.85 * L.day]} />
      <directionalLight
        ref={sun}
        position={[L.dir[0] * 30, Math.max(0.5, L.dir[1] * 30), L.dir[2] * 30]}
        intensity={L.sunIntensity}
        color={L.sunColor}
        castShadow
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-far={80}
      />
      {room.lamps.pendants.map((p, i) => (
        <pointLight
          key={`p${i}`}
          position={p}
          intensity={(room.id === 'lobby' ? 16 : 9) * lamp}
          distance={room.id === 'lobby' ? 14 : 9}
          decay={2}
          color={L.warm}
          castShadow={quality === 'high' && i === 0}
          shadow-mapSize={[512, 512]}
        />
      ))}
      {room.lamps.spots.map(([x, z]) => (
        <SpotDown key={`s${x}${z}`} x={x} z={z} y={ceiling - 0.02} intensity={(room.id === 'lobby' ? 60 : 22) * lamp} color={L.warm} />
      ))}
      {(room.lamps.low ?? []).map((p, i) => (
        <pointLight key={`l${i}`} position={p} intensity={2.2 * lamp} distance={4} decay={2} color={L.warm} />
      ))}
    </>
  )
}

function SpotDown({ x, z, y, intensity, color }: { x: number; z: number; y: number; intensity: number; color: string }) {
  const ref = useRef<THREE.SpotLight>(null)
  const { scene } = useThree()
  useEffect(() => {
    const s = ref.current
    if (!s) return
    s.target.position.set(x, 0, z)
    scene.add(s.target)
    return () => void scene.remove(s.target)
  }, [scene, x, z])
  return (
    <>
      <spotLight ref={ref} position={[x, y, z]} angle={0.62} penumbra={0.85} intensity={intensity} distance={y + 4} decay={2} color={color} />
      <mesh position={[x, y + 0.015, z]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[0.06, 24]} />
        <meshBasicMaterial color={intensity > 1 ? '#fff1dc' : '#3a3836'} />
      </mesh>
    </>
  )
}

/* ------------------------------------------------------------------ the canvas */

function Ready({ onReady }: { onReady?: () => void }) {
  const n = useRef(0)
  useFrame(({ invalidate }) => {
    if (++n.current === 3) onReady?.()
    else if (n.current < 3) invalidate()
  })
  return null
}

export default function Scene(p: SceneProps) {
  const walkables = useRef<THREE.Object3D[]>([])
  const trace = !!p.snapshot
  const [overhead, setOverhead] = useState(false)
  const L = lightFor(p.hour, p.weather, p.mood)
  const { room } = p
  return (
    // drawn on demand: only while the camera moves, the light changes or rain falls, so the glass panes
    // over it are not re-blurred every frame while nothing happens
    <Canvas
      frameloop="demand"
      shadows="soft"
      dpr={p.quality === 'high' ? [1, 1.5] : [1, 1.25]}
      gl={{ antialias: true }}
      camera={{ fov: 60, near: 0.1, far: 2000, position: room.views[0].pos }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <Suspense fallback={null}>
        <group key={room.id}>
          <Lights L={L} room={room} quality={p.quality} />
          <Outside L={L} weather={p.weather} room={room} />
          <Shell room={room} overhead={overhead} day={L.day} />
          <Surfaces surfaces={p.surfaces} lays={p.lays} quality={p.quality} trace={trace} glow={L.lamps} walkables={walkables} onPick={p.onPick} />
          <Furniture room={room} lamps={L.lamps} warm={L.warm} trace={trace} />
        </group>
        <Ready onReady={p.onReady} />
      </Suspense>
      <Walk room={room} view={p.view} viewKey={p.viewKey} walkables={walkables} locked={trace} onOverhead={setOverhead} />
      {p.snapshot && <Snapshot job={p.snapshot} light={L} onDone={p.onSnapshot} />}
    </Canvas>
  )
}
