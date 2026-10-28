import {
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
  useGLTF,
  useTexture,
} from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Finish } from '../data/catalog'
import { tileSrc } from '../textures/designs'

// A furnished living room, 6 × 5 m and 3 m high, rendered live. The floor
// (and, if asked, the back wall) is laid with the chosen design at its true
// size: one tile is drawn into a canvas with its grout joint and repeated
// across the room, so a 600 × 600 tile shows the right number of joints per
// metre. A glossy floor mirrors the room; daylight comes through a tall
// window on the left. Furniture: CC0 models from Poly Haven.

export type Layout = 'straight' | 'half'
export type Light = 'day' | 'evening'

export interface RoomProps {
  design: string
  tileMm: [number, number]
  finish: Finish
  wall: boolean
  grout: 'light' | 'dark'
  layout: Layout
  light: Light
  /** path-traced stills: physical materials only, the room closed behind the camera, light from the sky */
  trace?: boolean
}

const W = 6
const D = 5
const H = 3
const GROUT = { light: '#d9d4c8', dark: '#3b3934' }

/** one tile (or, half offset, a two-row repeat) with its grout joint, ready to tile across a surface */
function useTiledTexture(design: string, tileMm: [number, number], grout: string, layout: Layout, across: number, along: number) {
  const img = useTexture(tileSrc(design))
  return useMemo(() => {
    const [w, h] = tileMm
    const pxPerMm = 1024 / Math.max(w, h)
    const tw = Math.round(w * pxPerMm)
    const th = Math.round(h * pxPerMm)
    const rows = layout === 'half' ? 2 : 1
    const c = document.createElement('canvas')
    c.width = tw
    c.height = th * rows
    const g = c.getContext('2d')!
    g.fillStyle = grout
    g.fillRect(0, 0, c.width, c.height)
    const j = Math.max(2, Math.round(2.5 * pxPerMm)) // a 2.5 mm joint
    const draw = (x: number, y: number) => g.drawImage(img.image as CanvasImageSource, x + j / 2, y + j / 2, tw - j, th - j)
    draw(0, 0)
    if (rows === 2) {
      draw(-tw / 2, th)
      draw(tw / 2, th)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 16
    t.repeat.set((across * 1000) / w, (along * 1000) / (h * rows))
    return t
  }, [img, tileMm, grout, layout, across, along])
}

function Floor({ design, tileMm, finish, grout, layout, trace }: RoomProps) {
  const map = useTiledTexture(design, tileMm, GROUT[grout], layout, W, D)
  useEffect(() => () => map.dispose(), [map])
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[W, D]} />
      {trace ? (
        <meshStandardMaterial map={map} roughness={finish === 'Glossy' ? 0.07 : finish === 'Matt' ? 0.7 : 0.45} metalness={0} />
      ) : finish === 'Glossy' ? (
        <MeshReflectorMaterial
          map={map}
          blur={[120, 40]}
          resolution={1024}
          mixBlur={0.5}
          mixStrength={1.4}
          mixContrast={1}
          roughness={0.12}
          metalness={0}
          mirror={0.5}
          depthScale={0.4}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
        />
      ) : (
        <meshStandardMaterial map={map} roughness={finish === 'Matt' ? 0.75 : 0.55} />
      )}
    </mesh>
  )
}

function BackWall(props: RoomProps) {
  return (
    <mesh position={[0, H / 2, -D / 2]} receiveShadow>
      <planeGeometry args={[W, H]} />
      {props.wall ? <TiledWall {...props} /> : <meshStandardMaterial color="#e8e3d9" roughness={0.92} />}
    </mesh>
  )
}

function TiledWall({ design, tileMm, finish, grout, layout }: RoomProps) {
  const map = useTiledTexture(design, tileMm, GROUT[grout], layout, W, H)
  useEffect(() => () => map.dispose(), [map])
  return <meshPhysicalMaterial map={map} roughness={finish === 'Glossy' ? 0.08 : 0.6} clearcoat={finish === 'Glossy' ? 0.8 : 0} />
}

/** the left wall, with a tall window cut into it and the garden beyond */
function WindowWall({ light, trace }: { light: Light; trace?: boolean }) {
  const view = useTexture('/images/garden-view.webp')
  view.colorSpace = THREE.SRGBColorSpace
  const x = -W / 2
  const wall = <meshStandardMaterial color="#ebe7de" roughness={0.95} />
  // opening: z from -1.5 to 1.1, y from 0.25 to 2.7
  return (
    <group>
      <mesh position={[x, H / 2, (-D / 2 - 1.5) / 2]} rotation-y={Math.PI / 2} receiveShadow castShadow>
        <boxGeometry args={[D / 2 - 1.5, H, 0.12]} />
        {wall}
      </mesh>
      <mesh position={[x, H / 2, (D / 2 + 1.1) / 2]} rotation-y={Math.PI / 2} receiveShadow castShadow>
        <boxGeometry args={[D / 2 - 1.1, H, 0.12]} />
        {wall}
      </mesh>
      <mesh position={[x, 0.125, -0.2]} rotation-y={Math.PI / 2} castShadow>
        <boxGeometry args={[2.6, 0.25, 0.12]} />
        {wall}
      </mesh>
      <mesh position={[x, (H + 2.7) / 2, -0.2]} rotation-y={Math.PI / 2} castShadow>
        <boxGeometry args={[2.6, H - 2.7, 0.12]} />
        {wall}
      </mesh>
      {/* the garden, lit by itself (emissive when path traced, so it also lights the room) */}
      <mesh position={[x - 1.4, 1.5, -0.2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[6, 3.4]} />
        {trace ? (
          <meshStandardMaterial color="#000000" emissiveMap={view} emissive="#ffffff" emissiveIntensity={0.9} />
        ) : (
          <meshBasicMaterial map={view} color={light === 'day' ? '#ffffff' : '#3a4a66'} toneMapped={false} />
        )}
      </mesh>
    </group>
  )
}

type V3 = [number, number, number]

function Model({ url, ...props }: { url: string; position?: V3; rotation?: V3; scale?: number }) {
  const { scene } = useGLTF(url, false)
  const copy = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })
    return c
  }, [scene])
  return <primitive object={copy} {...props} />
}

const FABRIC = <meshStandardMaterial color="#d6cfc2" roughness={0.97} />

/** a low modern sofa: a plinth, two seat cushions, a back and two arms, all softly rounded */
function Sofa(props: { position: V3; rotation?: V3 }) {
  return (
    <group {...props}>
      <RoundedBox args={[2.5, 0.22, 0.98]} radius={0.04} position={[0, 0.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a2724" roughness={0.6} />
      </RoundedBox>
      {[-0.56, 0.56].map((x) => (
        <RoundedBox key={x} args={[1.1, 0.2, 0.74]} radius={0.08} smoothness={6} position={[x, 0.34, 0.08]} castShadow receiveShadow>
          {FABRIC}
        </RoundedBox>
      ))}
      <RoundedBox args={[2.3, 0.5, 0.24]} radius={0.1} smoothness={6} position={[0, 0.56, -0.36]} castShadow receiveShadow>
        {FABRIC}
      </RoundedBox>
      {[-1.18, 1.18].map((x) => (
        <RoundedBox key={x} args={[0.2, 0.46, 0.98]} radius={0.09} smoothness={6} position={[x, 0.42, 0]} castShadow receiveShadow>
          {FABRIC}
        </RoundedBox>
      ))}
    </group>
  )
}

/** a low block table cut from Orvane's own Travertino */
function StoneTable(props: { position: V3 }) {
  const map = useTexture(tileSrc('travertino'))
  map.colorSpace = THREE.SRGBColorSpace
  return (
    <RoundedBox args={[1.15, 0.34, 0.68]} radius={0.015} position={[props.position[0], 0.17, props.position[2]]} castShadow receiveShadow>
      <meshStandardMaterial map={map} roughness={0.32} metalness={0} />
    </RoundedBox>
  )
}

function Lights({ light }: { light: Light }) {
  const day = light === 'day'
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={day ? 0.7 : 0.25}>
        <color attach="background" args={[day ? '#c9cdd0' : '#0b0d10']} />
        {/* the window: a bright panel on the left */}
        <Lightformer form="rect" intensity={day ? 6 : 0.6} color={day ? '#fffaf0' : '#7d8db0'} position={[-5, 1.6, -0.2]} scale={[3, 2.6, 1]} />
        <Lightformer form="rect" intensity={day ? 1.2 : 0.2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 5, 1]} />
        {!day && <Lightformer form="circle" intensity={3} color="#ffc98a" position={[1.8, 1.4, -1]} scale={0.6} />}
      </Environment>
      <ambientLight intensity={day ? 0.15 : 0.04} />
      {day && (
        <directionalLight
          position={[-7, 4.2, 1.2]}
          intensity={3.4}
          color="#fff3df"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
      )}
      {!day && (
        <>
          <pointLight position={[1.9, 1.5, -1.3]} intensity={6} distance={7} decay={2} color="#ffc98a" castShadow />
          <pointLight position={[-1.4, 2.6, -0.4]} intensity={2.5} distance={6} decay={2} color="#ffd9a8" />
        </>
      )}
    </>
  )
}

/** the room itself, without a camera or controls, for the still renderer (the home page's room) */
export function RoomContents(props: RoomProps) {
  return (
    <>
      {!props.trace && <Lights light={props.light} />}
      <Floor {...props} />
      <BackWall {...props} />
      <WindowWall light={props.light} trace={props.trace} />
      {props.trace && (
        // the wall behind the camera, so the room is lit only through its window
        <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial color="#d9d3c8" roughness={0.95} />
        </mesh>
      )}
      {/* right wall and ceiling close the room for the reflections */}
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color="#e6e1d7" roughness={0.95} />
      </mesh>
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#f1eee8" roughness={1} />
      </mesh>
      <Sofa position={[0.1, 0, -1.9]} />
      <StoneTable position={[0.1, 0, -0.55]} />
      <Model
        url="/models/mid_century_lounge_chair/mid_century_lounge_chair.gltf"
        position={[1.85, 0, -0.25]}
        rotation={[0, -1.1, 0]}
      />
      <Model url="/models/potted_plant_02/potted_plant_02.gltf" position={[-2.45, 0.22, -2.05]} scale={2.2} />
    </>
  )
}

;['mid_century_lounge_chair', 'potted_plant_02'].forEach((m) =>
  useGLTF.preload(`/models/${m}/${m}.gltf`, false),
)
