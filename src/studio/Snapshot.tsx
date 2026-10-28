import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { WebGLPathTracer } from 'three-gpu-pathtracer'
import skyUrl from '../render/hdr/sky-2k.hdr?url'

// A photograph of the room as it stands: the same scene path traced, light
// bouncing off every surface, until it has enough samples to be still. It
// takes over the canvas while it develops, one sample a frame in four tiles
// so the page stays responsive, and hands back the finished frame as a JPEG.
// The sky outside comes from a real HDR photograph, dimmed with the hour.

export interface SnapshotJob {
  id: number
  samples: number
}

export function Snapshot({
  job,
  light,
  onDone,
}: {
  job: SnapshotJob
  light: { day: number }
  onDone: (url: string | null, progress: number) => void
}) {
  const { gl, scene, camera } = useThree()
  const hdr = useLoader(HDRLoader, skyUrl)
  const pt = useRef<WebGLPathTracer | null>(null)
  const frames = useRef(0)
  const done = useRef(false)

  useEffect(() => {
    const L = light
    const was = {
      env: scene.environment,
      bg: scene.background,
      envI: scene.environmentIntensity,
      bgI: scene.backgroundIntensity,
    }
    hdr.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = hdr
    scene.environmentIntensity = 0.04 + 0.85 * L.day
    if (L.day > 0.2) {
      scene.background = hdr
      scene.backgroundIntensity = 0.2 + 0.8 * L.day
    }
    // the live sky is a shader the tracer cannot read; the photograph's sky stands in for it
    const hidden: THREE.Object3D[] = []
    scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined
      if (mat && (mat as THREE.ShaderMaterial).isShaderMaterial && !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        if (o.visible) hidden.push(o)
        o.visible = false
      }
    })
    const p = new WebGLPathTracer(gl)
    p.tiles.set(2, 2)
    p.bounces = 5
    p.transmissiveBounces = 3
    p.filterGlossyFactor = 0.4
    p.minSamples = 1
    p.fadeDuration = 0
    p.renderDelay = 0
    pt.current = p
    return () => {
      hidden.forEach((o) => (o.visible = true))
      scene.environment = was.env
      scene.background = was.bg
      scene.environmentIntensity = was.envI
      scene.backgroundIntensity = was.bgI
      p.dispose()
      pt.current = null
    }
    // the light is read once, when the photograph starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, hdr, job.id])

  // priority 1: while this runs, the tracer draws the canvas instead of the usual render
  useFrame(({ invalidate }) => {
    const p = pt.current
    if (!p || done.current) return
    // the canvas draws on demand; the photograph asks for frames until it is developed
    invalidate()
    frames.current++
    if (frames.current < 4) {
      // let the plain materials that replace the mirror settle first
      gl.render(scene, camera)
      return
    }
    if (frames.current === 4) p.setScene(scene, camera)
    p.renderSample()
    const progress = Math.min(1, p.samples / job.samples)
    if (progress < 1) {
      if (frames.current % 4 === 0) onDone(null, progress)
      return
    }
    done.current = true
    onDone(gl.domElement.toDataURL('image/jpeg', 0.92), 1)
  }, 1)

  return null
}
