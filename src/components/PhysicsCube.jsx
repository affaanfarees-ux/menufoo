import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const GRAVITY = 0.6
const DAMPING = 0.65
const FRICTION = 0.97
const CUBE_SIZE = 288 // 3 inches
const NUM_OBSTACLES = 4
const OBS_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6']

function makeObstacle(id) {
  const size = Math.floor(Math.random() * (384 - 96 + 1) + 96) // 1–4 inches
  return {
    id,
    size,
    color: OBS_COLORS[id % OBS_COLORS.length],
    x: Math.random() * Math.max(10, window.innerWidth - size),
    y: Math.random() * Math.max(10, window.innerHeight - size),
  }
}

export default function PhysicsPlayground() {
  const { cubeEnabled, obstaclesEnabled } = useTheme()

  // --- Cube state ---
  const cubeRef = useRef(null)
  const cube = useRef({
    x: Math.random() * (window.innerWidth - CUBE_SIZE),
    y: -CUBE_SIZE,
    vx: 2, vy: 0,
    dragging: false, dragVx: 0, dragVy: 0,
    lastX: 0, lastY: 0, lastTime: 0,
  })

  // Reset cube when it becomes enabled
  useEffect(() => {
    if (cubeEnabled) {
      cube.current.x = Math.random() * (window.innerWidth - CUBE_SIZE)
      cube.current.y = -CUBE_SIZE
      cube.current.vx = 2
      cube.current.vy = 0
    }
  }, [cubeEnabled])

  // --- Obstacle state ---
  const [obstacles, setObstacles] = useState([])
  const obstacleRefs = useRef([])
  const obsData = useRef([])

  useEffect(() => {
    if (obstaclesEnabled) {
      const obs = Array.from({ length: NUM_OBSTACLES }, (_, i) => makeObstacle(i))
      obsData.current = obs
      setObstacles(obs)
    } else {
      obsData.current = []
      setObstacles([])
    }
  }, [obstaclesEnabled])

  // --- Drag tracking ---
  const dragTarget = useRef(null) // 'cube' | number | null

  // --- Animation loop (always runs while mounted) ---
  useEffect(() => {
    let raf

    function loop() {
      const c = cube.current

      if (cubeEnabled && !c.dragging) {
        c.vy += GRAVITY
        c.x += c.vx
        c.y += c.vy

        const maxY = window.innerHeight - CUBE_SIZE
        const maxX = window.innerWidth - CUBE_SIZE

        if (c.y >= maxY) { c.y = maxY; c.vy *= -DAMPING; c.vx *= FRICTION; if (Math.abs(c.vy) < 1) c.vy = 0 }
        if (c.y < 0)     { c.y = 0;    c.vy *= -DAMPING }
        if (c.x < 0)     { c.x = 0;    c.vx *= -DAMPING }
        if (c.x >= maxX) { c.x = maxX; c.vx *= -DAMPING }

        // Obstacle collision (AABB)
        obsData.current.forEach((obs) => {
          const overlapX = Math.min(c.x + CUBE_SIZE, obs.x + obs.size) - Math.max(c.x, obs.x)
          const overlapY = Math.min(c.y + CUBE_SIZE, obs.y + obs.size) - Math.max(c.y, obs.y)
          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              c.x += c.x < obs.x ? -overlapX : overlapX
              c.vx *= -DAMPING
            } else {
              c.y += c.y < obs.y ? -overlapY : overlapY
              c.vy *= -DAMPING
            }
          }
        })
      }

      if (cubeEnabled && cubeRef.current) {
        cubeRef.current.style.transform = `translate(${c.x}px, ${c.y}px)`
      }

      // Update obstacle DOM positions
      obsData.current.forEach((obs, i) => {
        const el = obstacleRefs.current[i]
        if (el) el.style.transform = `translate(${obs.x}px, ${obs.y}px)`
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
        c.x = e.clientX - CUBE_SIZE / 2
        c.y = e.clientY - CUBE_SIZE / 2
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
    c.x = t.clientX - CUBE_SIZE / 2
    c.y = t.clientY - CUBE_SIZE / 2
    c.lastX = t.clientX; c.lastY = t.clientY; c.lastTime = now
  }

  function onCubeTouchEnd() {
    const c = cube.current
    c.dragging = false
    c.vx = c.dragVx; c.vy = c.dragVy
    dragTarget.current = null
  }

  // --- Obstacle handlers ---
  function onObsMouseDown(e, i) {
    e.preventDefault(); e.stopPropagation()
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

  function onObsTouchEnd() {
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
            width: CUBE_SIZE, height: CUBE_SIZE,
            zIndex: 9999, cursor: 'grab',
            userSelect: 'none', touchAction: 'none', willChange: 'transform',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00cc00, #0000ff, #8800ff, #ff0088)',
            backgroundSize: '400% 400%',
            animation: 'cubeRainbow 2.5s linear infinite',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.3)',
          }}
        />
      )}

      {obstacles.map((obs, i) => (
        <div
          key={obs.id}
          ref={el => obstacleRefs.current[i] = el}
          onMouseDown={e => onObsMouseDown(e, i)}
          onTouchStart={e => onObsTouchStart(e, i)}
          onTouchMove={e => onObsTouchMove(e, i)}
          onTouchEnd={() => onObsTouchEnd()}
          style={{
            position: 'fixed', top: 0, left: 0,
            width: obs.size, height: obs.size,
            zIndex: 9998, cursor: 'grab',
            userSelect: 'none', touchAction: 'none', willChange: 'transform',
            borderRadius: 12,
            backgroundColor: obs.color,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            transform: `translate(${obs.x}px, ${obs.y}px)`,
          }}
        />
      ))}
    </>
  )
}
