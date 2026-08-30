import { useEffect, useState } from 'react'

const PARTICLE_COUNT = 8

export default function MegaStar({ active, onToggle, disabled = false }) {
  const [bursting, setBursting] = useState(false)
  const [particles, setParticles] = useState([])

  function handleClick() {
    if (disabled) return
    const nextActive = !active
    onToggle(nextActive)
    if (nextActive) {
      setParticles(
        Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
          id: `${Date.now()}-${i}`,
          dx: `${Math.round((Math.random() - 0.5) * 70)}px`,
          delay: `${Math.round(Math.random() * 150)}ms`,
        }))
      )
      setBursting(true)
    }
  }

  useEffect(() => {
    if (!bursting) return
    const t = setTimeout(() => setBursting(false), 900)
    return () => clearTimeout(t)
  }, [bursting])

  return (
    <span className="mega-star-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={active ? 'Mega star active!' : '5 stars! Click for a mega star'}
        className={`mega-star-btn ${active ? 'active' : ''}`}
      >
        ★
      </button>
      {bursting &&
        particles.map((p) => (
          <span
            key={p.id}
            className="mega-particle"
            style={{ '--dx': p.dx, animationDelay: p.delay }}
          >
            ✦
          </span>
        ))}
    </span>
  )
}
