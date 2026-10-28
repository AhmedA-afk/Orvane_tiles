import * as THREE from 'three'
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js'

// The stone on your own floor, through the phone's camera. On an iPhone, AR
// Quick Look: a patch of the laid stone is written out as a USDZ file on the
// spot and handed to the phone, which places it on the floor at true size.
// On Android, WebXR: the camera finds the floor, a ring shows where the patch
// will go, and a tap lays it there. Loaded only when asked for.

export type ArKind = 'quicklook' | 'webxr' | null

export async function arSupport(): Promise<ArKind> {
  const a = document.createElement('a')
  if (a.relList?.supports?.('ar')) return 'quicklook'
  const xr = (navigator as Navigator & { xr?: { isSessionSupported(m: string): Promise<boolean> } }).xr
  if (xr && (await xr.isSessionSupported('immersive-ar').catch(() => false))) return 'webxr'
  return null
}

/** a square patch of the laid stone, `metres` a side, lying flat */
function patch(tex: HTMLCanvasElement, metres: number, finish: { roughness: number }) {
  const map = new THREE.CanvasTexture(tex)
  map.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(metres, metres), new THREE.MeshStandardMaterial({ map, roughness: finish.roughness, metalness: 0 }))
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/** iPhone and iPad: a USDZ written on the spot, opened in AR Quick Look */
export async function openQuickLook(tex: HTMLCanvasElement, metres: number, finish: { roughness: number }, name: string) {
  const scene = new THREE.Scene()
  scene.add(patch(tex, metres, finish))
  const data = await new USDZExporter().parseAsync(scene)
  const url = URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }))
  const a = document.createElement('a')
  a.rel = 'ar'
  a.href = url
  a.download = `${name}.usdz`
  // Quick Look opens only from a link that holds an image
  a.appendChild(document.createElement('img'))
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 60_000)
}

/** Android: a WebXR session that finds the floor and lays the patch where the visitor taps */
export async function openWebXR(tex: HTMLCanvasElement, metres: number, finish: { roughness: number }, label: string) {
  const overlay = document.createElement('div')
  overlay.className = 'ar-overlay'
  overlay.innerHTML = `<p class="ar-say">Point at the floor, then tap to lay ${label}.</p><button class="ar-done" type="button">Done</button>`
  document.body.appendChild(overlay)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.xr.enabled = true
  overlay.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a7a66', 2.4))
  const sun = new THREE.DirectionalLight('#fff4e4', 1.6)
  sun.position.set(1, 3, 1)
  scene.add(sun)
  const stone = patch(tex, metres, finish)
  stone.visible = false
  const placed = new THREE.Group()
  placed.add(stone)
  placed.matrixAutoUpdate = false
  scene.add(placed)
  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.15, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff' }))
  reticle.matrixAutoUpdate = false
  reticle.visible = false
  scene.add(reticle)
  const camera = new THREE.PerspectiveCamera()

  type XRSessionLike = EventTarget & {
    requestReferenceSpace(t: string): Promise<unknown>
    requestHitTestSource?(o: { space: unknown }): Promise<unknown>
    end(): Promise<void>
  }
  const xr = (navigator as Navigator & { xr: { requestSession(m: string, o: object): Promise<XRSessionLike> } }).xr
  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlay },
  })
  renderer.xr.setReferenceSpaceType('local')
  await renderer.xr.setSession(session as never)
  const viewer = await session.requestReferenceSpace('viewer')
  const source = await session.requestHitTestSource?.({ space: viewer })

  session.addEventListener('select', () => {
    if (!reticle.visible) return
    placed.matrix.copy(reticle.matrix)
    stone.visible = true
    overlay.querySelector('.ar-say')!.textContent = 'Tap again to move it.'
  })
  const finish_ = () => session.end()
  overlay.querySelector('.ar-done')!.addEventListener('click', finish_)
  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null)
    renderer.dispose()
    overlay.remove()
  })

  renderer.setAnimationLoop((_t, frame) => {
    if (frame && source) {
      const ref = renderer.xr.getReferenceSpace()
      const hits = (frame as unknown as { getHitTestResults(s: unknown): { getPose(r: unknown): { transform: { matrix: Float32Array } } | undefined }[] }).getHitTestResults(source)
      const pose = hits[0]?.getPose(ref)
      reticle.visible = !!pose
      if (pose) reticle.matrix.fromArray(pose.transform.matrix)
    }
    renderer.render(scene, camera)
  })
}
