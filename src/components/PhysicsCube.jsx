import { useEffect, useRef } from 'react'

const GRAVITY = 0.6
const DAMPING = 0.65
const FRICTION = 0.97

export default function PhysicsCube() {
  const cubeRef = useRef(null)
  const sizeRef = useRef(window.innerWidth < 640 ? 96 : 300)
  const state = useRef({
    x: 80,
    y: -sizeRef.current,
    vx: 2,
    vy: 0,
    dragging: false,
    dragVx: 0,
    dragVy: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  })

  useEffect(() => {
    const SIZE = sizeRef.current
    const s = state.current
    s.x = Math.random() * (window.innerWidth - SIZE)
    s.y = -SIZE

    let raf

    function loop() {
      if (!s.dragging) {
        s.vy += GRAVITY
        s.x += s.vx
        s.y += s.vy

        const maxY = window.innerHeight - SIZE
        const maxX = window.innerWidth - SIZE

        if (s.y >= maxY) {
          s.y = maxY
          s.vy *= -DAMPING
          s.vx *= FRICTION
          if (Math.abs(s.vy) < 1) s.vy = 0
        }
        if (s.y < 0) { s.y = 0; s.vy *= -DAMPING }
        if (s.x < 0) { s.x = 0; s.vx *= -DAMPING }
        if (s.x >= maxX) { s.x = maxX; s.vx *= -DAMPING }
      }

      if (cubeRef.current) {
        cubeRef.current.style.transform = `translate(${s.x}px, ${s.y}px)`
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const s = state.current
    const SIZE = sizeRef.current

    function onMouseMove(e) {
      if (!s.dragging) return
      const now = Date.now()
      const dt = Math.max(now - s.lastTime, 1)
      s.dragVx = ((e.clientX - s.lastX) / dt) * 16
      s.dragVy = ((e.clientY - s.lastY) / dt) * 16
      s.x = e.clientX - SIZE / 2
      s.y = e.clientY - SIZE / 2
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.lastTime = now
    }

    function onMouseUp() {
      if (!s.dragging) return
      s.dragging = false
      s.vx = s.dragVx
      s.vy = s.dragVy
      if (cubeRef.current) cubeRef.current.style.cursor = 'grab'
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function onMouseDown(e) {
    e.preventDefault()
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.lastTime = Date.now()
    s.dragVx = 0
    s.dragVy = 0
    if (cubeRef.current) cubeRef.current.style.cursor = 'grabbing'
  }

  function onTouchStart(e) {
    const touch = e.touches[0]
    const s = state.current
    s.dragging = true
    s.lastX = touch.clientX
    s.lastY = touch.clientY
    s.lastTime = Date.now()
    s.dragVx = 0
    s.dragVy = 0
  }

  function onTouchMove(e) {
    e.preventDefault()
    const touch = e.touches[0]
    const s = state.current
    const SIZE = sizeRef.current
    const now = Date.now()
    const dt = Math.max(now - s.lastTime, 1)
    s.dragVx = ((touch.clientX - s.lastX) / dt) * 16
    s.dragVy = ((touch.clientY - s.lastY) / dt) * 16
    s.x = touch.clientX - SIZE / 2
    s.y = touch.clientY - SIZE / 2
    s.lastX = touch.clientX
    s.lastY = touch.clientY
    s.lastTime = now
  }

  function onTouchEnd() {
    const s = state.current
    s.dragging = false
    s.vx = s.dragVx
    s.vy = s.dragVy
  }

  const SIZE = sizeRef.current

  return (
    <div
      ref={cubeRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        zIndex: 9999,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        willChange: 'transform',
        borderRadius: 12,
        background: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00cc00, #0000ff, #8800ff, #ff0088)',
        backgroundSize: '400% 400%',
        animation: 'cubeRainbow 2.5s linear infinite',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.3)',
      }}
    />
  )
}
