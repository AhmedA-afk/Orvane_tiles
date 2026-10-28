import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { RoomDef } from './rooms'

// Walking the room. The camera stands at eye height and turns on the spot:
// drag to look round a full circle, click the floor (or the terrace) to walk
// there, pinch to lens in and out, the arrow keys or WASD to step. The views are named places to stand, and the plan is the room seen
// from above, for reading a pattern whole. Every move eases, never jumps.

type V3 = [number, number, number]
const EYE = 1.6

function aim(from: V3, to: V3) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }
}

/** a named place to stand, or the plan: the room from straight above, high enough to see it whole */
function pose(room: RoomDef, view: string) {
  if (view === 'plan') {
    const span = Math.max(room.w + room.terrace, room.d * 1.6)
    return { pos: [-room.terrace / 2, span * 1.05 + 2, 0.0001] as V3, yaw: 0, pitch: -Math.PI / 2 + 0.0005, fov: 52 }
  }
  const v = room.views.find((x) => x.id === view) ?? room.views[0]
  return { pos: v.pos, ...aim(v.pos, v.target), fov: v.fov }
}

export function Walk({
  room,
  view,
  viewKey,
  walkables,
  locked,
  onOverhead,
}: {
  room: RoomDef
  view: string
  viewKey: number
  walkables: RefObject<THREE.Object3D[]>
  locked: boolean
  onOverhead: (overhead: boolean) => void
}) {
  const bounds = room.bounds
  const { camera, gl, invalidate } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const first = pose(room, room.views[0].id)
  const goal = useRef({ pos: new THREE.Vector3(...first.pos), yaw: first.yaw, pitch: first.pitch, fov: first.fov })
  const now = useRef({ yaw: first.yaw, pitch: first.pitch })
  const ring = useRef<THREE.Mesh>(null)
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plan = useRef(view === 'plan')

  // a named view eases the camera there
  useEffect(() => {
    const v = pose(room, view)
    plan.current = view === 'plan'
    onOverhead(plan.current)
    goal.current.pos.set(...v.pos)
    goal.current.fov = v.fov
    // turn the short way round
    const turn = v.yaw - now.current.yaw
    goal.current.yaw = now.current.yaw + Math.atan2(Math.sin(turn), Math.cos(turn))
    goal.current.pitch = v.pitch
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, viewKey, room])

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    const el = gl.domElement
    let down: { x: number; y: number; moved: number } | null = null
    const pointers = new Map<number, { x: number; y: number }>()
    let pinch = 0

    const hit = (e: PointerEvent | MouseEvent) => {
      const r = el.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const floors = walkables.current ?? []
      return ray.intersectObjects(floors, false)[0]
    }
    const clampXZ = (v: THREE.Vector3) => {
      v.x = THREE.MathUtils.clamp(v.x, bounds.x[0], bounds.x[1])
      v.z = THREE.MathUtils.clamp(v.z, bounds.z[0], bounds.z[1])
      return v
    }

    const onDown = (e: PointerEvent) => {
      if (locked) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
      down = { x: e.clientX, y: e.clientY, moved: 0 }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (locked) return
      const prev = pointers.get(e.pointerId)
      if (prev && pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        goal.current.fov = THREE.MathUtils.clamp(goal.current.fov - (d - pinch) * 0.08, 32, 78)
        invalidate()
        pinch = d
        if (down) down.moved = 99
        return
      }
      if (down && prev) {
        const dx = e.clientX - prev.x
        const dy = e.clientY - prev.y
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        down.moved += Math.abs(dx) + Math.abs(dy)
        if (!plan.current) {
          // drag the world: the view turns the way the hand moves it
          const k = (goal.current.fov / 60) * 0.0042
          goal.current.yaw += dx * k
          goal.current.pitch = THREE.MathUtils.clamp(goal.current.pitch + dy * k, -1.2, 1.2)
          invalidate()
        }
        if (ring.current) ring.current.visible = false
        return
      }
      // hovering: show where a click would take you
      if (e.pointerType === 'mouse' && ring.current) {
        const h = hit(e)
        ring.current.visible = !!h
        if (h) ring.current.position.set(h.point.x, h.point.y + 0.01, h.point.z)
        invalidate()
      }
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (!down || locked) return
      const click = down.moved < 6
      down = null
      if (!click) return
      const h = hit(e)
      if (!h) return
      // from the plan, a click puts you on your feet at that spot, looking in
      if (plan.current) {
        plan.current = false
        onOverhead(false)
        goal.current.pitch = -0.08
        goal.current.fov = 62
      }
      goal.current.pos.copy(clampXZ(new THREE.Vector3(h.point.x, EYE, h.point.z)))
      invalidate()
    }
    // a trackpad pinch arrives as a wheel with ctrl held; a plain wheel still scrolls the page
    const onWheel = (e: WheelEvent) => {
      if (locked || !e.ctrlKey) return
      e.preventDefault()
      goal.current.fov = THREE.MathUtils.clamp(goal.current.fov + e.deltaY * 0.03, 32, 78)
      invalidate()
    }
    const onLeave = () => {
      if (ring.current) ring.current.visible = false
      invalidate()
    }
    const onKey = (e: KeyboardEvent) => {
      if (locked || plan.current) return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const f = { w: 1, arrowup: 1, s: -1, arrowdown: -1 }[e.key.toLowerCase()] ?? 0
      const s = { d: 1, arrowright: 1, a: -1, arrowleft: -1 }[e.key.toLowerCase()] ?? 0
      if (!f && !s) return
      if (document.activeElement !== el && !el.contains(document.activeElement)) return
      e.preventDefault()
      const y = goal.current.yaw
      const step = 0.45
      const next = goal.current.pos
        .clone()
        .add(new THREE.Vector3(-Math.sin(y) * f * step + Math.cos(y) * s * step, 0, -Math.cos(y) * f * step - Math.sin(y) * s * step))
      goal.current.pos.copy(clampXZ(next))
      invalidate()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [camera, gl, walkables, locked, bounds, ray, onOverhead, invalidate])

  useFrame((_, dt) => {
    if (locked) return
    // a long gap between frames (the canvas draws on demand) must not jump the camera
    const k = 1 - Math.exp(-Math.min(dt, 1 / 30) * 5.5)
    cam.position.lerp(goal.current.pos, k)
    now.current.yaw += (goal.current.yaw - now.current.yaw) * k
    now.current.pitch += (goal.current.pitch - now.current.pitch) * k
    cam.rotation.set(now.current.pitch, now.current.yaw, 0, 'YXZ')
    if (Math.abs(cam.fov - goal.current.fov) > 0.01) {
      cam.fov += (goal.current.fov - cam.fov) * k
      cam.updateProjectionMatrix()
    }
    // keep drawing until the camera has settled, then stop
    const moving =
      cam.position.distanceToSquared(goal.current.pos) > 1e-7 ||
      Math.abs(goal.current.yaw - now.current.yaw) > 1e-4 ||
      Math.abs(goal.current.pitch - now.current.pitch) > 1e-4 ||
      Math.abs(cam.fov - goal.current.fov) > 0.01
    if (moving) invalidate()
  })

  return (
    <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false} renderOrder={10}>
      <ringGeometry args={[0.17, 0.21, 48]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthTest={false} />
    </mesh>
  )
}
