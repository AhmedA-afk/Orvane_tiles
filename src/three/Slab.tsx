import { useTexture } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Finish } from '../data/catalog'
import { finishById, LEGACY_FINISH, type FinishLook } from '../data/range/finishes'
import { DESIGNS, normalSrc, tileSrc } from '../textures/designs'

// One porcelain piece in world units (metres): by default a 0.8 × 1.6 m slab,
// 9 mm thick, its face cut from a real CC0 scan. The face is a separate plane
// so a new face (another design, colourway or format) can fade in over the
// old one. The finish sets the physics, not a filter: polished is glaze under
// a clear coat, matt scatters, relief finishes light the scan's normal map.
//
// A piece shows a window of its face texture (`uv`), so a 600 × 600 tile cut
// from a slab-sized scan shows veins at their true scale, and `flip` mirrors
// the window for bookmatching and for the different faces in a crate.

export const SLAB = { w: 0.8, h: 1.6, d: 0.009 }
const BODY = '#cdbfa9'

export interface FaceSrc {
  map: string
  normal?: string
}

/** the part of the face texture a piece shows: offset and size, 0..1 */
export interface UvWindow {
  offset: [number, number]
  repeat: [number, number]
}

const FULL: UvWindow = { offset: [0, 0], repeat: [1, 1] }
const NO_FLIP: [boolean, boolean] = [false, false]

/** the face of one of the first fifteen designs, from its id */
function legacyFace(design: string, hd: boolean): FaceSrc {
  const big = hd && !!DESIGNS[design]?.hd
  return { map: tileSrc(design, big ? 'hd' : 'lg'), normal: DESIGNS[design]?.normal ? normalSrc(design) : undefined }
}

const legacyLook = (finish: Finish) => finishById(LEGACY_FINISH[finish]).look

/** a plane whose UVs show `uv` of the texture, mirrored as asked */
function useWindow(size: [number, number], uv: UvWindow, flip: [boolean, boolean]) {
  const [w, h] = size
  const [ou, ov] = uv.offset
  const [ru, rv] = uv.repeat
  const [fu, fv] = flip
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h)
    const a = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < a.count; i++) {
      const u = fu ? 1 - a.getX(i) : a.getX(i)
      const v = fv ? 1 - a.getY(i) : a.getY(i)
      a.setXY(i, ou + u * ru, ov + v * rv)
    }
    a.needsUpdate = true
    return g
  }, [w, h, ou, ov, ru, rv, fu, fv])
  useEffect(() => () => geo.dispose(), [geo])
  return geo
}

function Face({
  src,
  look,
  opacity = 1,
  size,
  depth,
  uv,
  flip,
}: {
  src: FaceSrc
  look: FinishLook
  opacity?: number | { current: number }
  size: [number, number]
  depth: number
  uv: UvWindow
  flip: [boolean, boolean]
}) {
  const urls = useMemo(() => {
    const u: Record<string, string> = { map: src.map }
    if (src.normal) u.normalMap = src.normal
    return u
  }, [src.map, src.normal])
  const tex = useTexture(urls) as { map: THREE.Texture; normalMap?: THREE.Texture }
  useEffect(() => {
    tex.map.anisotropy = 8
    tex.map.colorSpace = THREE.SRGBColorSpace
    tex.map.needsUpdate = true
  }, [tex])
  const geo = useWindow(size, uv, flip)
  const mat = useRef<THREE.MeshPhysicalMaterial>(null)
  const fading = typeof opacity === 'object'
  useFrame(() => {
    if (fading && mat.current) mat.current.opacity = opacity.current
  })
  const relief = src.normal ? look.relief : 0
  return (
    <mesh geometry={geo} position-z={depth / 2 + 0.0002} renderOrder={fading ? 2 : 1}>
      <meshPhysicalMaterial
        ref={mat}
        map={tex.map}
        normalMap={src.normal ? tex.normalMap : null}
        normalScale={[relief, relief]}
        roughness={look.roughness}
        clearcoat={look.clearcoat}
        clearcoatRoughness={look.clearcoatRoughness}
        transparent={fading}
        opacity={fading ? opacity.current : 1}
        depthWrite={!fading}
      />
    </mesh>
  )
}

type SlabProps = {
  /** one of the first fifteen designs, with its default face */
  design?: string
  /** a legacy finish, for `design` */
  finish?: Finish
  /** an explicit face texture, for the range */
  face?: FaceSrc
  /** an explicit finish look, for the range */
  look?: FinishLook
  uv?: UvWindow
  flip?: [boolean, boolean]
  /** thickness in metres */
  depth?: number
  fade?: number
  size?: [number, number]
  /** use a design's full-resolution face where it has one */
  hd?: boolean
} & ThreeElements['group']

const keyOf = (f: FaceSrc, uv: UvWindow, flip: [boolean, boolean]) =>
  `${f.map}|${uv.offset.join()}|${uv.repeat.join()}|${flip.join()}`

/** The body (edges and back) with its face. A new face fades in over `fade` seconds. */
export function Slab({
  design = 'statuario',
  finish = 'Glossy',
  face,
  look,
  uv = FULL,
  flip = NO_FLIP,
  depth = SLAB.d,
  fade = 1.6,
  size = [SLAB.w, SLAB.h],
  hd = false,
  ...group
}: SlabProps) {
  const src = useMemo(() => face ?? legacyFace(design, hd), [face, design, hd])
  const lk = look ?? legacyLook(finish)
  const next = { src, uv, flip, key: keyOf(src, uv, flip) }
  const [shown, setShown] = useState(next)
  const [incoming, setIncoming] = useState<typeof next | null>(null)
  const t = useRef({ current: 0 })
  if (next.key !== shown.key && next.key !== incoming?.key) {
    t.current.current = 0
    setIncoming(next)
  }
  useFrame((_, delta) => {
    if (!incoming) return
    t.current.current = Math.min(1, t.current.current + delta / fade)
    if (t.current.current >= 1) {
      setShown(incoming)
      setIncoming(null)
    }
  })
  return (
    <group {...group}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size[0], size[1], depth]} />
        <meshStandardMaterial color={BODY} roughness={0.85} />
      </mesh>
      <Face src={shown.src} look={lk} size={size} depth={depth} uv={shown.uv} flip={shown.flip} />
      {incoming && (
        <Suspense fallback={null}>
          <Face
            key={incoming.key}
            src={incoming.src}
            look={lk}
            opacity={t.current}
            size={size}
            depth={depth}
            uv={incoming.uv}
            flip={incoming.flip}
          />
        </Suspense>
      )}
    </group>
  )
}

export function preloadDesign(design: string, hd = false) {
  useTexture.preload(tileSrc(design, hd && DESIGNS[design]?.hd ? 'hd' : 'lg'))
  if (DESIGNS[design]?.normal) useTexture.preload(normalSrc(design))
}

export function preloadFace(face: FaceSrc) {
  useTexture.preload(face.map)
  if (face.normal) useTexture.preload(face.normal)
}
