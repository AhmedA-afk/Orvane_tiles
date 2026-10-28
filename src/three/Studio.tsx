import { Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

// A product studio that can change in a moment from a pale cyclorama to a
// black room. Glossy porcelain shows the studio itself in its reflections, so
// the environment is live (re-baked every frame): the key softbox can be swept
// around the slab, and the walls can fade from soft grey to black.
// `read` returns the current { dark, key, warm? } each frame; `warm` (0..1)
// turns the lights from daylight to a lamp-warm evening.

const LIGHT_WALL = new THREE.Color('#e4e4df')
const DARK_WALL = new THREE.Color('#000000')
const DAY = new THREE.Color('#ffffff')
const LAMP = new THREE.Color('#ffc58a')
const SUN_DAY = new THREE.Color('#fffaf2')

export function Studio({ read }: { read: () => { dark: number; key: number; warm?: number } }) {
  const wall = useRef<THREE.Color>(null)
  const key = useRef<THREE.Mesh>(null)
  const fill = useRef<THREE.Mesh>(null)
  const top = useRef<THREE.Mesh>(null)
  const sun = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const { dark, key: k, warm = 0 } = read()
    wall.current?.copy(LIGHT_WALL).lerp(DARK_WALL, dark)
    if (key.current) {
      // the key softbox travels on an arc in front of the slab
      const a = k * 1.15
      key.current.position.set(Math.sin(a) * 4.2, 1.1, Math.cos(a) * 4.2)
      key.current.lookAt(0, 0, 0)
    }
    const setI = (m: THREE.Mesh | null, v: number) => {
      const mat = m?.material as THREE.MeshBasicMaterial | undefined
      if (mat) mat.color.copy(DAY).lerp(LAMP, warm).multiplyScalar(v)
    }
    // in the black room the key is only a reflection: a silver band, not a glare
    setI(key.current, 7 - dark * 3.5)
    setI(fill.current, 1.2 - dark * 1.1)
    setI(top.current, 2.2 - dark * 1.8)
    if (sun.current) {
      sun.current.intensity = 2.6 - dark * 1.6
      sun.current.color.copy(SUN_DAY).lerp(LAMP, warm)
    }
  })

  return (
    <>
      <Environment resolution={256} frames={Infinity}>
        <color ref={wall} attach="background" args={['#c9c9c4']} />
        {/* a broad overhead softbox: the soft gradient across every glossy face */}
        <Lightformer ref={top} form="rect" intensity={1} position={[0, 4.5, 1]} rotation-x={Math.PI / 2} scale={[10, 5, 1]} />
        {/* the key: a tall strip that the film sweeps round the slab */}
        <Lightformer ref={key} form="rect" intensity={1} position={[-2, 1.1, 3.6]} scale={[0.45, 9, 1]} />
        {/* fill from behind the camera, rim strips behind the slab */}
        <Lightformer ref={fill} form="rect" intensity={1} position={[0, 0.5, 6]} scale={[9, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-3.4, 0.6, -2.8]} scale={[0.5, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.0} position={[3.4, 0.6, -2.8]} scale={[0.5, 7, 1]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight ref={sun} position={[2.5, 4, 3]} intensity={1.6} color="#fffaf2" />
      <ambientLight intensity={0.08} />
    </>
  )
}
