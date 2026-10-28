import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

// The dark room every slab is shown in: a black studio whose softboxes only
// the glossy faces reflect, one spot from above that pools light on the slab
// and the floor, and a dark polished floor that fades into the page's own
// ground colour, so a render and the page read as one surface.

type V3 = [number, number, number]

export interface Former {
  position: V3
  scale: V3
  intensity: number
  target?: V3
  color?: string
}

/**
 * Where to hang a softbox so a mirror-polished face shows its reflection at
 * `point`: along the camera ray reflected off the face. This is how a product
 * photographer places the streak on a glossy surface. The environment is
 * captured from the origin, so only the direction matters; `dist` sets how
 * far out the softbox hangs (its scale should grow with it).
 */
export function mirrorLight(camera: V3, point: V3, normal: V3, dist = 5): V3 {
  const n = new THREE.Vector3(...normal).normalize()
  const d = new THREE.Vector3(...point).sub(new THREE.Vector3(...camera)).normalize()
  const r = d.sub(n.clone().multiplyScalar(2 * d.dot(n)))
  return r.multiplyScalar(dist).toArray() as V3
}

/** the outward normal of a face turned `ry` about Y and leant `rx` about X (Euler YXZ) */
export function faceNormal(rx: number, ry: number): V3 {
  return new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(rx, ry, 0, 'YXZ')).toArray() as V3
}

export function Gallery({
  ground = '#161c1a',
  floor = true,
  spot = 1,
  spotAt = [0, 0.8, 0],
  spotFrom = [0.3, 4.6, 2.2],
  fogNear = 3.2,
  fogFar = 9,
  formers = [],
  exposure,
  fill = 0.5,
  spotAngle = 0.34,
}: {
  ground?: string
  floor?: boolean
  spot?: number
  spotAt?: V3
  spotFrom?: V3
  fogNear?: number
  fogFar?: number
  /** extra softboxes, usually streaks placed with mirrorLight() */
  formers?: Former[]
  exposure?: number
  /** the broad soft reflection over every glossy face; lower it on white stone so the face keeps its falloff */
  fill?: number
  spotAngle?: number
}) {
  const target = useMemo(() => new THREE.Object3D(), [])
  return (
    <>
      <fog attach="fog" args={[ground, fogNear, fogFar]} />
      <Environment resolution={512} frames={1} environmentIntensity={exposure ?? 1}>
        <color attach="background" args={['#020303']} />
        {/* broad soft fill high behind the camera: the glossy face never goes dead */}
        <Lightformer form="rect" intensity={fill} color="#fbf6ee" position={[0, 3, 6]} scale={[8, 3, 1]} />
        {/* rim strips behind the slab: thin highlights on its edges */}
        <Lightformer form="rect" intensity={1.2} position={[-2.6, 1.2, -2]} scale={[0.5, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[2.6, 1.2, -2]} scale={[0.5, 4, 1]} />
        {formers.map((f, i) => (
          <Lightformer
            key={i}
            form="rect"
            intensity={f.intensity}
            color={f.color ?? '#fffaf2'}
            position={f.position}
            scale={f.scale}
            target={f.target ?? [0, 0, 0]}
          />
        ))}
      </Environment>
      <primitive object={target} position={spotAt} />
      <spotLight
        name="gallery-spot"
        position={spotFrom}
        target={target}
        angle={spotAngle}
        penumbra={1}
        intensity={110 * spot}
        decay={2}
        color="#fff4e4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      {floor && (
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <MeshReflectorMaterial
            blur={[260, 90]}
            resolution={1024}
            mixBlur={0.8}
            mixStrength={36}
            mixContrast={1.1}
            roughness={0.7}
            depthScale={1.2}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.4}
            color={ground}
            metalness={0.5}
            mirror={0.35}
          />
        </mesh>
      )}
    </>
  )
}
