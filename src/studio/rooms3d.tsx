import { MeshReflectorMaterial, RoundedBox, useGLTF, useTexture } from '@react-three/drei'
import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { designById } from '../data/range'
import { faceOf } from '../three/surface'
import type { RoomDef, RoomId } from './rooms'

// The furniture of each room, made of simple solids (a sofa, an island, a
// bath, a bed, loungers) and a few CC0 models from Poly Haven (the lounge
// chair, the sideboard, the pendant, vases and plants). The stone surfaces
// themselves are laid by the scene; this is everything that stands on them.

type V3 = [number, number, number]

export interface FurnitureProps {
  room: RoomDef
  /** 0 off, 1 full: how far up the lamps are */
  lamps: number
  /** the lamps' colour, from the mood */
  warm: string
  trace: boolean
}

const m = (id: string) => `/models/${id}/${id}.gltf`
const MODELS = ['mid_century_lounge_chair', 'modern_wooden_cabinet', 'ceramic_vase_02', 'ceramic_vase_04', 'potted_plant_04', 'potted_plant_02', 'modern_ceiling_lamp_01']
MODELS.forEach((id) => useGLTF.preload(m(id), false))

function Model({ id, ...props }: { id: string; position?: V3; rotation?: V3; scale?: number }) {
  const { scene } = useGLTF(m(id), false)
  const copy = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })
    return c
  }, [scene])
  return <primitive object={copy} {...props} />
}

/** a glazed or wet surface; the path tracer takes it without the clear coat, which it renders black */
function Gloss({ color, roughness, trace, env = 1 }: { color: string; roughness: number; trace: boolean; env?: number }) {
  return trace ? (
    <meshStandardMaterial color={color} roughness={Math.max(0.05, roughness)} envMapIntensity={env} />
  ) : (
    <meshPhysicalMaterial color={color} roughness={roughness} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={env} />
  )
}

/** a plain solid, the workhorse of the rooms */
function Box({ size, at, color, rough = 0.8, metal = 0, rot }: { size: V3; at: V3; color: string; rough?: number; metal?: number; rot?: V3 }) {
  return (
    <mesh position={at} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  )
}

function Soft({ size, at, color, radius = 0.08, rot }: { size: V3; at: V3; color: string; radius?: number; rot?: V3 }) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={6} position={at} rotation={rot} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.96} />
    </RoundedBox>
  )
}

const BRASS = '#b08d57'
const OAK = '#7a5a3e'
const INK = '#26231f'
const LINEN = '#d8d0c2'

/** the pendant over a table or an island: the model, and its bulb glowing with the lamps */
function Pendant({ at, scale = 1, lamps, warm, h }: { at: V3; scale?: number; lamps: number; warm: string; h: number }) {
  return (
    <group>
      <Model id="modern_ceiling_lamp_01" position={[at[0], h - 1.17 * scale, at[2]]} scale={scale} />
      <mesh position={[at[0], h - 0.92 * scale, at[2]]}>
        <sphereGeometry args={[0.07 * scale, 16, 12]} />
        <meshBasicMaterial color={new THREE.Color('#3a3530').lerp(new THREE.Color(warm), lamps)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Sofa({ position, rotation, scale = 1 }: { position: V3; rotation?: V3; scale?: number }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[2.9, 0.18, 1.02]} radius={0.03} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={INK} roughness={0.6} />
      </RoundedBox>
      {[-0.7, 0.7].map((x) => (
        <Soft key={x} size={[1.36, 0.2, 0.78]} at={[x, 0.3, 0.08]} color={LINEN} />
      ))}
      <Soft size={[2.7, 0.48, 0.24]} at={[0, 0.52, -0.38]} color={LINEN} radius={0.1} />
      {[-1.36, 1.36].map((x) => (
        <Soft key={x} size={[0.2, 0.42, 1.02]} at={[x, 0.38, 0]} color={LINEN} radius={0.09} />
      ))}
    </group>
  )
}

/** a low block table cut from Orvane's own Portoro */
function StoneTable({ position, rotation, size = [1.5, 0.32, 0.8], trace }: { position: V3; rotation?: V3; size?: V3; trace: boolean }) {
  const d = designById('portoro')!
  const map = useTexture(faceOf(d, d.colourways[0]).map)
  map.colorSpace = THREE.SRGBColorSpace
  return (
    <RoundedBox args={size} radius={0.012} position={[position[0], size[1] / 2, position[2]]} rotation={rotation} castShadow receiveShadow>
      {trace ? <meshStandardMaterial map={map} roughness={0.08} /> : <meshPhysicalMaterial map={map} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} />}
    </RoundedBox>
  )
}

function Stool({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.74, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.06, 32]} />
        <meshStandardMaterial color="#6b4a33" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.37, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.72, 12]} />
        <meshStandardMaterial color={INK} roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
        <meshStandardMaterial color={INK} roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  )
}

/** a table lamp: a stem and a glowing drum shade */
function TableLamp({ at, lamps, warm }: { at: V3; lamps: number; warm: string }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.06, 0.32, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.35} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.2, 32, 1, true]} />
        <meshStandardMaterial color="#efe6d6" emissive={warm} emissiveIntensity={lamps * 1.4} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ the rooms */

function Living({ room, lamps, warm, trace }: FurnitureProps) {
  const { d, h, w } = room
  return (
    <group>
      {/* the sofa faces the glass and the sea; the table and the chair complete the circle */}
      <Sofa position={[2.55, 0, 0.1]} rotation={[0, -Math.PI / 2, 0]} />
      <StoneTable position={[0.9, 0, 0.1]} rotation={[0, Math.PI / 2, 0]} trace={trace} />
      <Model id="mid_century_lounge_chair" position={[-1.55, 0, 0.9]} rotation={[0, 2.2, 0]} />
      {/* a low sideboard floats in front of the feature wall */}
      <Model id="modern_wooden_cabinet" position={[0.9, 0, -d / 2 + 0.38]} />
      <Model id="ceramic_vase_02" position={[0.15, 0.68, -d / 2 + 0.38]} />
      <Model id="ceramic_vase_04" position={[0.45, 0.68, -d / 2 + 0.34]} />
      <Model id="potted_plant_04" position={[0.9, 0.32, 0.45]} />
      <Model id="potted_plant_02" position={[-3.0, 0.22, -2.7]} scale={2.4} />
      <Model id="potted_plant_02" position={[-w / 2 - 3.3, 0.22, 2.6]} scale={2.1} rotation={[0, 1.4, 0]} />
      <Pendant at={[0.9, 0, 0.1]} lamps={lamps} warm={warm} h={h} />
    </group>
  )
}

function Kitchen({ room, lamps, warm }: FurnitureProps) {
  const { d, h, w } = room
  const front = '#c9c0b2'
  return (
    <group>
      {/* the run of base cabinets under the worktop, handleless, with shadow gaps */}
      {[-1.775, -0.725, 0.325, 1.375].map((x) => (
        <Box key={x} size={[1.04, 0.84, 0.62]} at={[x, 0.52, -d / 2 + 0.31]} color={front} rough={0.7} />
      ))}
      <Box size={[4.2, 0.1, 0.56]} at={[-0.2, 0.05, -d / 2 + 0.28]} color={INK} />
      {/* the hob, set into the worktop */}
      <Box size={[0.8, 0.006, 0.52]} at={[-0.9, 0.946, -d / 2 + 0.33]} color="#0d0d0e" rough={0.08} />
      {/* the tall bank: fridge and ovens */}
      <Box size={[1.25, 2.6, 0.64]} at={[w / 2 - 0.66, 1.3, -d / 2 + 0.32]} color={front} rough={0.7} />
      <Box size={[0.6, 0.5, 0.01]} at={[w / 2 - 0.66, 1.25, -d / 2 + 0.645]} color="#141516" rough={0.1} metal={0.4} />
      <Box size={[0.6, 0.5, 0.01]} at={[w / 2 - 0.66, 1.8, -d / 2 + 0.645]} color="#141516" rough={0.1} metal={0.4} />
      {/* the island's core, and its sink and tap */}
      <Box size={[2.76, 0.9, 1.06]} at={[0.4, 0.46, -0.4]} color="#2f2a25" />
      <Box size={[0.7, 0.01, 0.42]} at={[0.95, 0.947, -0.52]} color="#1d1c1b" rough={0.3} metal={0.5} />
      <mesh position={[0.95, 1.12, -0.82]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.36, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.95} />
      </mesh>
      <mesh position={[0.95, 1.3, -0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.22, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.95} />
      </mesh>
      {[-0.5, 0.4, 1.3].map((x) => (
        <Stool key={x} at={[x, 0, 0.62]} />
      ))}
      {room.lamps.pendants.map((p) => (
        <Pendant key={p[0]} at={p} scale={0.72} lamps={lamps} warm={warm} h={h} />
      ))}
      <Model id="ceramic_vase_02" position={[0.9, 0.944, -d / 2 + 0.3]} />
      <Model id="ceramic_vase_04" position={[1.15, 0.944, -d / 2 + 0.28]} scale={0.8} />
      <Model id="potted_plant_04" position={[-0.4, 0.944, -0.3]} />
      <Model id="potted_plant_02" position={[-w / 2 + 0.6, 0.22, d / 2 - 0.7]} scale={2.2} />
    </group>
  )
}

function Bath({ room, lamps, warm, trace }: FurnitureProps) {
  const { d, h } = room
  const white = '#f3f1ec'
  return (
    <group>
      {/* a freestanding bath at the glass, full of still water */}
      <RoundedBox args={[0.84, 0.58, 1.76]} radius={0.27} smoothness={8} position={[-1.2, 0.29, 0.15]} castShadow receiveShadow>
        <Gloss color={white} roughness={0.12} trace={trace} />
      </RoundedBox>
      <mesh position={[-1.2, 0.575, 0.15]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.33, 0.78, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#c8dfe2" roughness={0.04} metalness={0.1} />
      </mesh>
      <mesh position={[-0.62, 0.48, 0.95]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.96, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.95} />
      </mesh>
      {/* the vanity: a drawer under the floating top, two basins, two spouts, a mirror */}
      <Box size={[1.7, 0.26, 0.5]} at={[0.2, 0.62, -d / 2 + 0.27]} color={OAK} rough={0.6} />
      {[-0.2, 0.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.875, -d / 2 + 0.3]} scale={[1, 1, 0.72]} castShadow>
            <cylinderGeometry args={[0.2, 0.17, 0.05, 40]} />
            <Gloss color={white} roughness={0.1} trace={trace} />
          </mesh>
          <mesh position={[x, 1.08, -d / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 12]} />
            <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.95} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.2, 1.62, -d / 2 + 0.012]}>
        <planeGeometry args={[1.6, 0.9]} />
        {trace ? (
          <meshStandardMaterial color="#e6ecee" roughness={0.02} metalness={1} />
        ) : (
          <MeshReflectorMaterial color="#7d8487" mirror={1} mixStrength={1.6} mixBlur={0} blur={[0, 0]} resolution={512} roughness={0.02} metalness={0} />
        )}
      </mesh>
      {/* the walk-in shower: a glass screen and a rain head */}
      <mesh position={[1.0, 1.05, 1.05]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 2.1]} />
        <meshPhysicalMaterial color="#e2ecee" transparent opacity={0.16} roughness={0.03} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Box size={[0.02, 2.1, 0.02]} at={[1.0, 1.05, 1.8]} color={BRASS} rough={0.3} metal={0.9} />
      <mesh position={[1.65, h - 0.03, 1.15]}>
        <cylinderGeometry args={[0.15, 0.15, 0.015, 40]} />
        <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* a towel, a stool, a plant */}
      <Soft size={[0.5, 0.06, 0.32]} at={[-1.2, 0.08, 1.35]} color="#e8e1d5" radius={0.03} />
      <mesh position={[-0.35, 0.22, 1.0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.44, 32]} />
        <meshStandardMaterial color={OAK} roughness={0.6} />
      </mesh>
      <Model id="potted_plant_02" position={[-1.75, 0.22, -1.45]} scale={1.8} />
      <Model id="potted_plant_04" position={[0.95, 0.866, -d / 2 + 0.25]} />
      {lamps > 0.02 && (
        <mesh position={[0.2, 2.1, -d / 2 + 0.04]}>
          <boxGeometry args={[1.6, 0.03, 0.03]} />
          <meshBasicMaterial color={new THREE.Color(warm).multiplyScalar(0.4 + lamps)} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

function Bedroom({ room, lamps, warm }: FurnitureProps) {
  const { d, w } = room
  const z0 = -d / 2
  return (
    <group>
      {/* the bed: a dark base, the mattress, a linen cover turned back, pillows, a low headboard */}
      <Box size={[2.05, 0.28, 2.25]} at={[0.3, 0.14, z0 + 1.2]} color="#3b3028" rough={0.6} />
      <Soft size={[1.95, 0.22, 2.12]} at={[0.3, 0.39, z0 + 1.22]} color="#f2efe9" radius={0.06} />
      <Soft size={[2.0, 0.08, 1.45]} at={[0.3, 0.52, z0 + 1.6]} color="#cfc2ad" radius={0.04} />
      {[-0.15, 0.75].map((x) => (
        <Soft key={x} size={[0.66, 0.16, 0.4]} at={[x, 0.58, z0 + 0.42]} color="#f6f4ef" radius={0.07} />
      ))}
      <Soft size={[2.5, 1.0, 0.1]} at={[0.3, 0.62, z0 + 0.06]} color="#b9ab97" radius={0.04} />
      {[-1.25, 1.85].map((x) => (
        <group key={x}>
          <Box size={[0.5, 0.48, 0.42]} at={[x, 0.24, z0 + 0.28]} color={OAK} rough={0.55} />
          <TableLamp at={[x, 0.48, z0 + 0.28]} lamps={lamps} warm={warm} />
        </group>
      ))}
      <Soft size={[1.5, 0.42, 0.45]} at={[0.3, 0.21, z0 + 2.75]} color="#8e7a63" radius={0.05} />
      {/* the wardrobe along the east wall */}
      <Box size={[0.62, 2.7, 2.2]} at={[w / 2 - 0.31, 1.35, 0.3]} color="#6b5340" rough={0.62} />
      <Model id="mid_century_lounge_chair" position={[-1.9, 0, 1.3]} rotation={[0, 2.4, 0]} />
      <Model id="potted_plant_02" position={[-2.3, 0.22, -1.9]} scale={2.1} />
    </group>
  )
}

function Lounger({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <Box size={[2.0, 0.24, 0.72]} at={[0, 0.16, 0]} color="#5b4532" rough={0.7} />
      <Soft size={[1.4, 0.08, 0.68]} at={[-0.28, 0.32, 0]} color="#f1ede4" radius={0.03} />
      <Soft size={[0.66, 0.08, 0.68]} at={[0.68, 0.5, 0]} color="#f1ede4" radius={0.03} rot={[0, 0, 0.62]} />
    </group>
  )
}

function Pool({ room, lamps, warm, trace }: FurnitureProps) {
  const zf = -room.d / 2
  return (
    <group>
      {/* the house: its wall carries the stone; two openings of dark glass, and a roof that shades the deck */}
      <Box size={[14.4, 3.9, 0.3]} at={[0, 1.95, zf - 0.15]} color="#ddd6ca" rough={0.9} />
      <Box size={[14.4, 0.28, 2.6]} at={[0, 3.74, zf + 1.0]} color="#e3ddd2" rough={0.9} />
      {[-3.2, 2.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.4, zf + 0.012]}>
            <planeGeometry args={[3.2, 2.8]} />
            <meshStandardMaterial color="#141a1e" roughness={0.05} metalness={0.7} />
          </mesh>
          <Box size={[3.3, 0.06, 0.04]} at={[x, 2.82, zf + 0.02]} color="#2a2622" metal={0.6} rough={0.5} />
          <Box size={[0.05, 2.8, 0.04]} at={[x, 1.4, zf + 0.02]} color="#2a2622" metal={0.6} rough={0.5} />
        </group>
      ))}
      {/* the infinity pool, its water meeting the sea at the west edge */}
      <mesh position={[-2.5, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 3.6]} />
        <Gloss color="#2a8597" roughness={0.03} trace={trace} env={1.4} />
      </mesh>
      {[-4.5, -1.6].map((x) => (
        <Lounger key={x} at={[x, 0, 3.0]} />
      ))}
      <group position={[-3.05, 0, 3.9]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.4, 12]} />
          <meshStandardMaterial color="#5b4532" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow>
          <coneGeometry args={[1.5, 0.45, 32, 1, true]} />
          <meshStandardMaterial color="#efe9de" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* a table and chairs in the shade of the roof */}
      <mesh position={[4.4, 0.74, zf + 2.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 40]} />
        <meshStandardMaterial color="#5b4532" roughness={0.6} />
      </mesh>
      <mesh position={[4.4, 0.37, zf + 2.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.12, 0.72, 16]} />
        <meshStandardMaterial color={INK} roughness={0.5} metalness={0.5} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => (
        <Soft key={a} size={[0.46, 0.44, 0.46]} at={[4.4 + Math.cos(a) * 0.92, 0.22, zf + 2.4 + Math.sin(a) * 0.92]} color="#d9d1c2" radius={0.08} />
      ))}
      {[-6, 0.6, 6].map((x) => (
        <Model key={x} id="potted_plant_02" position={[x, 0.22, zf + 0.6]} scale={2.6} rotation={[0, x, 0]} />
      ))}
      {/* low lights along the deck, glowing at dusk */}
      {(room.lamps.low ?? []).map((p) => (
        <mesh key={`${p[0]}${p[2]}`} position={[p[0], 0.18, p[2]]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.36, 16]} />
          <meshStandardMaterial color="#2a2622" emissive={warm} emissiveIntensity={lamps * 1.5} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Lobby({ room, lamps, warm, trace }: FurnitureProps) {
  const { h } = room
  return (
    <group>
      {/* the reception desk's core, behind its stone */}
      <Box size={[4.76, 1.08, 0.66]} at={[1.6, 0.54, -2.75]} color="#1f1c19" />
      <Model id="ceramic_vase_04" position={[0.2, 1.1, -2.85]} scale={1.3} />
      {/* a seating group by the glass */}
      <Sofa position={[-3.4, 0, 2.7]} rotation={[0, Math.PI, 0]} />
      <Sofa position={[-3.4, 0, -0.9]} />
      <StoneTable position={[-3.4, 0, 0.9]} size={[1.8, 0.34, 1.0]} trace={trace} />
      <Model id="mid_century_lounge_chair" position={[-5.6, 0, 0.9]} rotation={[0, Math.PI / 2, 0]} />
      <Model id="potted_plant_02" position={[-6.3, 0.22, -4.2]} scale={3.2} />
      <Model id="potted_plant_02" position={[5.8, 0.22, -4.2]} scale={3.2} rotation={[0, 2, 0]} />
      <Model id="potted_plant_02" position={[-6.3, 0.22, 4.3]} scale={2.8} rotation={[0, 1, 0]} />
      {room.lamps.pendants.map((p) => (
        <Pendant key={p[0]} at={p} scale={1.5} lamps={lamps} warm={warm} h={h - 0.2} />
      ))}
      {/* the pendants hang on long rods from the double-height ceiling */}
      {room.lamps.pendants.map((p) => (
        <mesh key={`rod${p[0]}`} position={[p[0], h - 0.1, p[2]]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
          <meshStandardMaterial color={INK} />
        </mesh>
      ))}
    </group>
  )
}

/** your own room: a sofa and a table if they fit, and a plant */
function Custom({ room, trace }: FurnitureProps) {
  const { w, d } = room
  const roomy = w >= 4 && d >= 3.4
  return (
    <group>
      {roomy && <Sofa position={[w / 2 - 0.6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={Math.min(1, d / 4.2)} />}
      {roomy && <StoneTable position={[w / 2 - 2.05, 0, 0]} rotation={[0, Math.PI / 2, 0]} trace={trace} />}
      <Model id="potted_plant_02" position={[-w / 2 + 0.55, 0.22, -d / 2 + 0.55]} scale={2.1} />
    </group>
  )
}

const ROOM_FURNITURE: Record<RoomId, (p: FurnitureProps) => ReactNode> = {
  custom: Custom,
  living: Living,
  kitchen: Kitchen,
  bath: Bath,
  bedroom: Bedroom,
  pool: Pool,
  lobby: Lobby,
}

export function Furniture(p: FurnitureProps) {
  const F = ROOM_FURNITURE[p.room.id]
  return <F {...p} />
}
