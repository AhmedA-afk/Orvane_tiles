import { ContactShadows, OrbitControls, PerspectiveCamera, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ContainerId } from '../data/catalog'
import { Studio } from './Studio'

// A shipping container standing open in the light studio, loaded with crates of
// tile. Whenever the tile size or container changes, the crates slide in
// through the doors one by one, the far end first, and stack where the
// payload allows. Its near wall is cut away so you can see in.

const INSIDE = { '20ft': { l: 5.9, w: 2.35, h: 2.39 }, '40ft': { l: 12.03, w: 2.35, h: 2.39 } } as const
const CRATE = { l: 1.1, w: 1.1, h: 0.82 }
const GAP = 0.05

function Shell({ c }: { c: ContainerId }) {
  const { l, w, h } = INSIDE[c]
  const steel = <meshStandardMaterial color="#2c2c30" roughness={0.5} metalness={0.55} side={THREE.DoubleSide} />
  // corrugation: thin ribs along the far wall and the roof edge
  const ribs = Math.floor(l / 0.28)
  return (
    <group position={[0, 0, 0]}>
      {/* floor */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[l, 0.12, w]} />
        <meshStandardMaterial color="#3a2f26" roughness={0.8} />
      </mesh>
      {/* far wall, roof, front end */}
      <mesh position={[0, h / 2 + 0.12, -w / 2 - 0.03]} receiveShadow castShadow>
        <boxGeometry args={[l, h, 0.06]} />
        {steel}
      </mesh>
      {Array.from({ length: ribs }, (_, i) => (
        <mesh key={i} position={[-l / 2 + 0.14 + i * 0.28, h / 2 + 0.12, -w / 2 - 0.07]}>
          <boxGeometry args={[0.1, h, 0.04]} />
          {steel}
        </mesh>
      ))}
      <mesh position={[0, h + 0.15, 0]} castShadow>
        <boxGeometry args={[l, 0.06, w + 0.12]} />
        {steel}
      </mesh>
      <mesh position={[-l / 2 - 0.03, h / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, h, w + 0.12]} />
        {steel}
      </mesh>
      {/* the two doors, swung open */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[l / 2 + 0.55, h / 2 + 0.12, s * (w / 2 + 0.02) + (s > 0 ? 0.0 : 0)]}
          rotation={[0, s * 0.18, 0]}
          castShadow
        >
          <boxGeometry args={[w / 2, h, 0.05]} />
          {steel}
        </mesh>
      ))}
    </group>
  )
}

function Crates({ c, pallets, tone }: { c: ContainerId; pallets: number; tone: string }) {
  const { l } = INSIDE[c]
  const perRow = Math.floor(l / (CRATE.l + GAP))
  const perTier = perRow * 2
  const slots = useMemo(
    () =>
      Array.from({ length: pallets }, (_, i) => {
        const tier = i < perTier ? 0 : 1
        const j = i - tier * perTier
        const col = Math.floor(j / 2)
        const row = j % 2
        return new THREE.Vector3(
          -l / 2 + GAP + CRATE.l / 2 + col * (CRATE.l + GAP),
          0.12 + CRATE.h / 2 + tier * (CRATE.h + 0.02),
          (row ? 1 : -1) * (CRATE.w / 2 + GAP / 2),
        )
      }),
    [pallets, perTier, l],
  )
  const refs = useRef<(THREE.Group | null)[]>([])
  const born = useRef(0)
  // a new load starts its entrance from the doors again
  useEffect(() => {
    born.current = performance.now()
  }, [c, pallets])
  useFrame(() => {
    const t = (performance.now() - born.current) / 1000
    refs.current.forEach((g, i) => {
      if (!g) return
      const target = slots[i]
      // each crate enters through the doors, 90 ms after the one before
      const k = THREE.MathUtils.clamp((t - i * 0.09) / 0.7, 0, 1)
      const e = 1 - Math.pow(1 - k, 3)
      g.position.set(THREE.MathUtils.lerp(l / 2 + 2.4, target.x, e), target.y + (1 - e) * 0.25, target.z)
      g.visible = k > 0
    })
  })
  return (
    <>
      {slots.map((_, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <RoundedBox args={[CRATE.l, CRATE.h, CRATE.w]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color={tone} roughness={0.85} />
          </RoundedBox>
          {/* the strap round each crate */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, CRATE.h + 0.004, CRATE.w + 0.004]} />
            <meshStandardMaterial color="#1c2522" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

const STILL = { dark: 0, key: -0.5 }

/** steps the camera back on narrow stages, so the whole container stays in frame */
function Fit({ long }: { long: boolean }) {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)
  useEffect(() => {
    const k = Math.max(1, 1.5 / aspect)
    const [x, y, z] = long ? [12, 8.5, 19] : [7, 5.2, 11.5]
    camera.position.set(x * k, y * k, z * k)
    camera.lookAt(0, 0.9, 0)
  }, [camera, aspect, long])
  return null
}

export default function ContainerScene({ container, pallets }: { container: ContainerId; pallets: number }) {
  const long = container === '40ft'
  const cam: [number, number, number] = long ? [12, 8.5, 19] : [7, 5.2, 11.5]
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
    >
      <PerspectiveCamera key={container} makeDefault fov={30} position={cam} />
      <Fit long={long} />
      <Studio read={() => STILL} />
      <hemisphereLight args={['#ffffff', '#d8d8d2', 0.7]} />
      <ContactShadows position={[0, 0.001, 0]} scale={long ? 18 : 11} blur={2.4} far={3} opacity={0.38} color="#20201c" />
      <group position={[0, 0, 0]}>
        <Shell c={container} />
        <Crates c={container} pallets={pallets} tone="#cfc6b6" />
      </group>
      <OrbitControls
        makeDefault
        target={[0, 0.9, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.45}
        minAzimuthAngle={0.1}
        maxAzimuthAngle={1.2}
      />
    </Canvas>
  )
}
