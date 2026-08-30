import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const GRAVITY = 0.6
const DAMPING = 0.65
const FRICTION = 0.97
const MOBILE_BREAKPOINT = 640
const OBS_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6']

function computeCubeSize() {
  return window.innerWidth < MOBILE_BREAKPOINT ? 110 : 288 // 288 = 3 inches
}

function computeObstacleRange() {
  return window.innerWidth < MOBILE_BREAKPOINT ? [40, 140] : [96, 384] // desktop: 1-4 inches
}

function makeObstacle(id, [min, max]) {
  const size = Math.floor(Math.random() * (max - min + 1) + min)
  return {
    id,
    size,
    color: OBS_COLORS[id % OBS_COLORS.length],
    x: Math.random() * Math.max(10, window.innerWidth - size),
    y: Math.random() * Math.max(10, window.innerHeight - size),
  }
}

function simpleBounds(x, y, size) {
  return { minX: x, maxX: x + size, minY: y, maxY: y + size }
}

// Bounding box of the cube's 4 corners after rotation — grows/shrinks as it spins
// (up to sqrt(2) * size at 45deg), so the hitbox actually tracks the visual tumble.
function rotatedBounds(x, y, size, rotDeg) {
  const cx = x + size / 2
  const cy = y + size / 2
  const rad = rotDeg * Math.PI / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const half = size / 2
  const corners = [[-half, -half], [half, -half], [half, half], [-half, half]]
    .map(([lx, ly]) => [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos])
  const xs = corners.map((p) => p[0])
  const ys = corners.map((p) => p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

function cubeBounds(x, y, size, rotDeg) {
  return rotDeg ? rotatedBounds(x, y, size, rotDeg) : simpleBounds(x, y, size)
}

function CubeFace({ size }) {
  const border = Math.max(2, Math.round(size * 0.035))
  const eye = Math.round(size * 0.12)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '30%', left: '26%', width: eye, height: eye, borderRadius: '50%', background: '#1a1a2e' }} />
      <div style={{ position: 'absolute', top: '30%', right: '26%', width: eye, height: eye, borderRadius: '50%', background: '#1a1a2e' }} />
      <div style={{
        position: 'absolute', bottom: '24%', left: '50%', transform: 'translateX(-50%)',
        width: '42%', height: '22%',
        borderBottom: `${border}px solid #1a1a2e`,
        borderRadius: '0 0 50% 50%',
      }} />
    </div>
  )
}

export default function PhysicsPlayground() {
  const {
    cubeEnabled, obstaclesEnabled, specialObstacles,
    cubeRotate, cubeFace, bonkMode, cubeSizeOverride,
  } = useTheme()

  // --- Cube size (responsive, or a fixed extreme-mode override) ---
  const [cubeSize, setCubeSize] = useState(() => cubeSizeOverride ?? computeCubeSize())
  const cubeSizeRef = useRef(cubeSize)
  useEffect(() => { cubeSizeRef.current = cubeSize }, [cubeSize])

  useEffect(() => {
    setCubeSize(cubeSizeOverride ?? computeCubeSize())
  }, [cubeSizeOverride])

  const cubeRotateRef = useRef(cubeRotate)
  useEffect(() => { cubeRotateRef.current = cubeRotate }, [cubeRotate])

  const bonkModeRef = useRef(bonkMode)
  useEffect(() => { bonkModeRef.current = bonkMode }, [bonkMode])

  // --- Cube state ---
  const cubeRef = useRef(null)
  const cube = useRef({
    x: Math.random() * (window.innerWidth - cubeSize),
    y: -cubeSize,
    vx: 2, vy: 0, rot: 0, angVel: 0,
    dragging: false, dragVx: 0, dragVy: 0,
    lastX: 0, lastY: 0, lastTime: 0,
  })

  // Reset cube when it becomes enabled
  useEffect(() => {
    if (cubeEnabled) {
      const size = cubeSizeRef.current
      cube.current.x = Math.random() * (window.innerWidth - size)
      cube.current.y = -size
      cube.current.vx = 2
      cube.current.vy = 0
      cube.current.rot = 0
      cube.current.angVel = 0
    }
  }, [cubeEnabled])

  // --- Bonk mode: floating "BONK!" popups ---
  const [bonkTexts, setBonkTexts] = useState([])
  function spawnBonk(x, y) {
    const id = `${Date.now()}-${Math.random()}`
    setBonkTexts((prev) => [...prev, { id, x, y }])
    setTimeout(() => setBonkTexts((prev) => prev.filter((b) => b.id !== id)), 700)
  }

  // Rescale on resize/orientation change (e.g. rotating a phone)
  useEffect(() => {
    function onResize() {
      const size = cubeSizeOverride ?? computeCubeSize()
      setCubeSize(size)
      const c = cube.current
      c.x = Math.min(c.x, Math.max(0, window.innerWidth - size))
      c.y = Math.min(c.y, Math.max(0, window.innerHeight - size))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [cubeSizeOverride])

  // --- Obstacle state ---
  const [obstacles, setObstacles] = useState([])
  const obstacleRefs = useRef([])
  const obsData = useRef([])

  useEffect(() => {
    if (obstaclesEnabled) {
      const range = computeObstacleRange()
      const obs = Array.from({ length: 5 }, (_, i) => makeObstacle(i, range))
      if (specialObstacles && obs.length > 0) {
        const smallest = obs.reduce((a, b) => a.size < b.size ? a : b)
        smallest.follower = true
        smallest.size = range[0]
        if (obs.length > 1) {
          const biggest = obs.reduce((a, b) => a.size > b.size ? a : b)
          if (biggest !== smallest) biggest.iceZone = true
        }
      }
      obsData.current = obs
      setObstacles(obs)
    } else {
      obsData.current = []
      setObstacles([])
    }
  }, [obstaclesEnabled, specialObstacles])

  // --- Drag tracking ---
  const dragTarget = useRef(null) // 'cube' | number | null

  // --- Animation loop (always runs while mounted) ---
  useEffect(() => {
    let raf

    function loop() {
      const c = cube.current
      const CUBE_SIZE = cubeSizeRef.current
      const rotate = cubeRotateRef.current
      const bonk = bonkModeRef.current

      const rotDeg = rotate ? c.rot : 0

      // Ice zone check — runs every frame regardless of drag state
      let inIce = false
      if (cubeEnabled) {
        const cbIce = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)
        obsData.current.forEach((obs) => {
          if (!obs.iceZone) return
          const overlapX = Math.min(cbIce.maxX, obs.x + obs.size) - Math.max(cbIce.minX, obs.x)
          const overlapY = Math.min(cbIce.maxY, obs.y + obs.size) - Math.max(cbIce.minY, obs.y)
          if (overlapX > 0 && overlapY > 0) inIce = true
        })
      }

      if (cubeEnabled && !c.dragging) {
        c.vy += GRAVITY
        c.x += c.vx
        c.y += c.vy

        // Hitbox follows the visual rotation — its bounding box grows/shrinks as the cube spins
        let cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)

        if (cb.maxY >= window.innerHeight) {
          c.y -= cb.maxY - window.innerHeight
          if (rotate) c.angVel += c.vx * 0.2 + (Math.random() - 0.5)
          c.vy *= -DAMPING; c.vx *= FRICTION; if (Math.abs(c.vy) < 1) c.vy = 0
          cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)
        }
        if (cb.minY < 0) {
          c.y -= cb.minY
          if (rotate) c.angVel += c.vx * 0.2 + (Math.random() - 0.5)
          c.vy *= -DAMPING
          cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)
        }
        if (cb.minX < 0) {
          c.x -= cb.minX
          if (rotate) c.angVel += c.vy * 0.2 + (Math.random() - 0.5)
          c.vx *= -DAMPING
          cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)
        }
        if (cb.maxX >= window.innerWidth) {
          c.x -= cb.maxX - window.innerWidth
          if (rotate) c.angVel += c.vy * 0.2 + (Math.random() - 0.5)
          c.vx *= -DAMPING
          cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)
        }

        // Obstacle collision — follower and ice zone pass through cube
        obsData.current.forEach((obs) => {
          if (obs.follower || obs.iceZone) return
          const overlapX = Math.min(cb.maxX, obs.x + obs.size) - Math.max(cb.minX, obs.x)
          const overlapY = Math.min(cb.maxY, obs.y + obs.size) - Math.max(cb.minY, obs.y)
          if (overlapX > 0 && overlapY > 0) {
            const impactX = Math.max(cb.minX, obs.x) + Math.min(overlapX, cb.maxX - cb.minX, obs.size) / 2
            const impactY = Math.max(cb.minY, obs.y) + Math.min(overlapY, cb.maxY - cb.minY, obs.size) / 2

            if (overlapX < overlapY) {
              c.x += (cb.minX + cb.maxX) / 2 < obs.x + obs.size / 2 ? -overlapX : overlapX
              if (rotate) c.angVel += c.vy * 0.2 + (Math.random() - 0.5)
              c.vx *= -DAMPING
            } else {
              c.y += (cb.minY + cb.maxY) / 2 < obs.y + obs.size / 2 ? -overlapY : overlapY
              if (rotate) c.angVel += c.vx * 0.2 + (Math.random() - 0.5)
              c.vy *= -DAMPING
            }
            cb = cubeBounds(c.x, c.y, CUBE_SIZE, rotDeg)

            if (bonk) {
              obs.vx = (obs.vx || 0) + c.vx * 1.1
              obs.vy = (obs.vy || 0) + c.vy * 1.1
              const now = Date.now()
              if (!obs.lastBonkAt || now - obs.lastBonkAt > 400) {
                obs.lastBonkAt = now
                spawnBonk(impactX, impactY)
              }
            }
          }
        })

        // Slow cube inside ice zone
        if (inIce) { c.vx *= 0.96; c.vy *= 0.96 }

        // Tumble the cube — spin persists on its own, only nudged by impacts (not locked to vx),
        // but settles out once the cube itself stops moving instead of spinning forever at rest.
        // Capped and settled aggressively: a fast/lingering spin makes the rotated hitbox's
        // bounding box pulse in size against the floor/walls every frame, which reads as shaking.
        if (rotate) {
          c.angVel = Math.max(-9, Math.min(9, c.angVel))
          c.rot = (c.rot + c.angVel) % 360
          const speed = Math.abs(c.vx) + Math.abs(c.vy)
          c.angVel *= speed < 1.5 ? 0.7 : 0.99
          if (speed < 1.5 && Math.abs(c.angVel) < 0.5) c.angVel = 0
        }
      }

      if (cubeEnabled && cubeRef.current) {
        cubeRef.current.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${rotate ? c.rot : 0}deg)`
        cubeRef.current.style.filter = inIce
          ? 'hue-rotate(160deg) saturate(0.45) brightness(1.4)'
          : ''
        cubeRef.current.style.boxShadow = inIce
          ? 'inset 0 0 0 8px rgba(160,230,255,0.85), inset 0 0 28px rgba(100,200,255,0.5), 0 0 28px rgba(100,200,255,0.6)'
          : '0 12px 40px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.3)'
        cubeRef.current.style.outline = inIce ? '3px solid rgba(200,240,255,0.7)' : ''
      }

      // Follower logic — smallest obstacle chases the cube
      if (cubeEnabled) {
        obsData.current.forEach((obs, i) => {
          if (obs.follower && dragTarget.current !== i) {
            const dx = c.x + CUBE_SIZE / 2 - (obs.x + obs.size / 2)
            const dy = c.y + CUBE_SIZE / 2 - (obs.y + obs.size / 2)
            const dist = Math.sqrt(dx * dx + dy * dy)
            obs.angle = Math.atan2(dy, dx) * 180 / Math.PI + 90 // always face cube
            const stopDist = (CUBE_SIZE + obs.size) / 2
            if (dist > stopDist) {
              // Desired direction toward cube
              let moveX = dx / dist
              let moveY = dy / dist

              // Repel away from other obstacles to steer around them
              obsData.current.forEach((other) => {
                if (other.follower) return
                const ox = (obs.x + obs.size / 2) - (other.x + other.size / 2)
                const oy = (obs.y + obs.size / 2) - (other.y + other.size / 2)
                const oDist = Math.sqrt(ox * ox + oy * oy)
                const influence = (obs.size + other.size) / 2 + 48
                if (oDist < influence && oDist > 0) {
                  const strength = (influence - oDist) / influence
                  moveX += (ox / oDist) * strength * 3
                  moveY += (oy / oDist) * strength * 3
                }
              })

              // Normalize and move at constant speed
              const mag = Math.sqrt(moveX * moveX + moveY * moveY)
              if (mag > 0) {
                obs.x += (moveX / mag) * 1.5
                obs.y += (moveY / mag) * 1.5
              }
              obs.arrived = false
            } else if (!obs.arrived) {
              obs.arrived = true
              obs.spinning = true
              obs.spinStart = Date.now()
            }
          }
        })
      }

      // Update obstacle DOM positions
      obsData.current.forEach((obs, i) => {
        const el = obstacleRefs.current[i]
        if (!el) return

        // Bonk-mode knockback momentum (decays via friction, clamped to viewport)
        if (dragTarget.current !== i && (obs.vx || obs.vy)) {
          obs.x += obs.vx
          obs.y += obs.vy
          obs.vx *= 0.9
          obs.vy *= 0.9
          if (Math.abs(obs.vx) < 0.05) obs.vx = 0
          if (Math.abs(obs.vy) < 0.05) obs.vy = 0
          const maxOX = window.innerWidth - obs.size
          const maxOY = window.innerHeight - obs.size
          if (obs.x < 0) { obs.x = 0; obs.vx = 0 }
          if (obs.x > maxOX) { obs.x = maxOX; obs.vx = 0 }
          if (obs.y < 0) { obs.y = 0; obs.vy = 0 }
          if (obs.y > maxOY) { obs.y = maxOY; obs.vy = 0 }
        }

        let rotation = obs.follower ? (obs.angle || 0) : 0
        if (obs.spinning) {
          const elapsed = Date.now() - obs.spinStart
          const duration = 600
          if (elapsed < duration) {
            rotation += (elapsed / duration) * 360
          } else {
            obs.spinning = false
          }
        }
        el.style.transform = `translate(${obs.x}px, ${obs.y}px) rotate(${rotation}deg)`
      })

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, []) // run once on mount; reads refs every frame

  // --- Global mouse handlers ---
  useEffect(() => {
    function onMouseMove(e) {
      const target = dragTarget.current
      if (target === null) return
      const now = Date.now()
      if (target === 'cube') {
        const c = cube.current
        const dt = Math.max(now - c.lastTime, 1)
        c.dragVx = (e.clientX - c.lastX) / dt * 16
        c.dragVy = (e.clientY - c.lastY) / dt * 16
        c.x = e.clientX - cubeSizeRef.current / 2
        c.y = e.clientY - cubeSizeRef.current / 2
        c.lastX = e.clientX; c.lastY = e.clientY; c.lastTime = now
      } else {
        const obs = obsData.current[target]
        if (!obs) return
        obs.x = e.clientX - obs.size / 2
        obs.y = e.clientY - obs.size / 2
      }
    }

    function onMouseUp() {
      const target = dragTarget.current
      if (target === 'cube') {
        const c = cube.current
        c.dragging = false
        c.vx = c.dragVx; c.vy = c.dragVy
        c.angVel += c.dragVx * 0.4
        if (cubeRef.current) cubeRef.current.style.cursor = 'grab'
      } else if (typeof target === 'number') {
        const obs = obsData.current[target]
        if (obs) obs.dragging = false
      }
      dragTarget.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // --- Cube handlers ---
  function onCubeMouseDown(e) {
    e.preventDefault()
    const c = cube.current
    c.dragging = true
    c.lastX = e.clientX; c.lastY = e.clientY; c.lastTime = Date.now()
    c.dragVx = 0; c.dragVy = 0
    dragTarget.current = 'cube'
    if (cubeRef.current) cubeRef.current.style.cursor = 'grabbing'
  }

  function onCubeTouchStart(e) {
    const t = e.touches[0]
    const c = cube.current
    c.dragging = true
    c.lastX = t.clientX; c.lastY = t.clientY; c.lastTime = Date.now()
    c.dragVx = 0; c.dragVy = 0
    dragTarget.current = 'cube'
  }

  function onCubeTouchMove(e) {
    e.preventDefault()
    const t = e.touches[0]
    const c = cube.current
    const now = Date.now()
    const dt = Math.max(now - c.lastTime, 1)
    c.dragVx = (t.clientX - c.lastX) / dt * 16
    c.dragVy = (t.clientY - c.lastY) / dt * 16
    c.x = t.clientX - cubeSizeRef.current / 2
    c.y = t.clientY - cubeSizeRef.current / 2
    c.lastX = t.clientX; c.lastY = t.clientY; c.lastTime = now
  }

  function onCubeTouchEnd() {
    const c = cube.current
    c.dragging = false
    c.vx = c.dragVx; c.vy = c.dragVy
    c.angVel += c.dragVx * 0.4
    dragTarget.current = null
  }

  // --- Obstacle handlers ---
  function onObsMouseDown(evt, i) {
    evt.preventDefault(); evt.stopPropagation()
    dragTarget.current = i
    if (obstacleRefs.current[i]) obstacleRefs.current[i].style.cursor = 'grabbing'
  }

  function onObsTouchStart(e, i) {
    dragTarget.current = i
  }

  function onObsTouchMove(evt, i) {
    evt.preventDefault()
    const t = evt.touches[0]
    const obs = obsData.current[i]
    if (!obs) return
    obs.x = t.clientX - obs.size / 2
    obs.y = t.clientY - obs.size / 2
  }

  function onObsTouchEnd(_e) {
    dragTarget.current = null
  }

  return (
    <>
      {cubeEnabled && (
        <div
          ref={cubeRef}
          onMouseDown={onCubeMouseDown}
          onTouchStart={onCubeTouchStart}
          onTouchMove={onCubeTouchMove}
          onTouchEnd={onCubeTouchEnd}
          style={{
            position: 'fixed', top: 0, left: 0,
            width: cubeSize, height: cubeSize,
            zIndex: 9999, cursor: 'grab',
            userSelect: 'none', touchAction: 'none', willChange: 'transform',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00cc00, #0000ff, #8800ff, #ff0088)',
            backgroundSize: '400% 400%',
            animation: 'cubeRainbow 2.5s linear infinite',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.3)',
          }}
        >
          {cubeFace && <CubeFace size={cubeSize} />}
        </div>
      )}

      {obstacles.map((obs, i) => (
        <div
          key={obs.id}
          ref={el => obstacleRefs.current[i] = el}
          onMouseDown={e => onObsMouseDown(e, i)}
          onTouchStart={e => onObsTouchStart(e, i)}
          onTouchMove={e => onObsTouchMove(e, i)}
          onTouchEnd={onObsTouchEnd}
          style={{
            position: 'fixed', top: 0, left: 0,
            width: obs.size, height: obs.size,
            zIndex: 9998, cursor: 'grab',
            userSelect: 'none', touchAction: 'none', willChange: 'transform',
            borderRadius: (obs.follower || obs.iceZone) ? 0 : 12,
            backgroundColor: obs.follower
              ? 'transparent'
              : obs.iceZone
              ? 'rgba(0, 206, 209, 0.18)'
              : obs.color,
            boxShadow: (obs.follower || obs.iceZone) ? 'none' : '0 8px 24px rgba(0,0,0,0.5)',
            filter: obs.follower
              ? 'grayscale(1) drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,1))'
              : obs.iceZone
              ? 'drop-shadow(0 0 12px rgba(0,206,209,0.9)) drop-shadow(0 0 6px rgba(0,206,209,0.6))'
              : 'none',
            clipPath: obs.iceZone
              ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
              : 'none',
            border: obs.iceZone ? '2px solid rgba(0,206,209,0.6)' : 'none',
            overflow: obs.iceZone ? 'hidden' : 'visible',
            transform: `translate(${obs.x}px, ${obs.y}px)`,
            display: (obs.follower || obs.iceZone) ? 'flex' : 'block',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: obs.follower ? obs.size * 0.9 : undefined,
            lineHeight: 1,
          }}
        >
          {obs.follower && '👾'}
          {obs.iceZone && Array.from({ length: 9 }, (_, si) => (
            <span
              key={si}
              style={{
                position: 'absolute',
                left: `${5 + (si * 11) % 85}%`,
                top: 0,
                fontSize: `${10 + (si % 3) * 6}px`,
                animation: `snowfall ${1.6 + (si % 4) * 0.55}s linear ${-(si * 0.45)}s infinite`,
                pointerEvents: 'none',
                userSelect: 'none',
                color: 'rgba(210, 245, 255, 0.9)',
              }}
            >❄</span>
          ))}
        </div>
      ))}

      {bonkTexts.map((b) => (
        <div key={b.id} className="bonk-text" style={{ left: b.x, top: b.y }}>
          BONK!
        </div>
      ))}
    </>
  )
}
