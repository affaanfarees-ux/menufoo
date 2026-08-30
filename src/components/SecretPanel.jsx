import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const CLICKS_NEEDED = 10
const CORNERS = ['tl', 'tr', 'bl', 'br']
const CORNER_STYLE = {
  tl: { top: 4, left: 4 },
  tr: { top: 4, right: 4 },
  bl: { bottom: 4, left: 4 },
  br: { bottom: 4, right: 4 },
}

function ScrewHead({ rotation }) {
  return (
    <span
      style={{
        display: 'block',
        width: 13, height: 13,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.32)',
        border: '1px solid rgba(0,0,0,0.35)',
        boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4), inset 0 -1px 1px rgba(255,255,255,0.2)',
        position: 'relative',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <span
        style={{
          position: 'absolute', top: '50%', left: '15%', right: '15%',
          height: 2, transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.75)',
        }}
      />
    </span>
  )
}

export default function SecretPanel() {
  const { unlockExtreme } = useTheme()
  const [clicks, setClicks] = useState({ tl: 0, tr: 0, bl: 0, br: 0 })
  const [stage, setStage] = useState('closed') // closed | swinging | falling

  function clickScrew(corner) {
    if (stage !== 'closed') return
    setClicks((prev) => {
      const next = { ...prev, [corner]: Math.min(CLICKS_NEEDED, prev[corner] + 1) }
      if (CORNERS.every((c) => next[c] >= CLICKS_NEEDED)) {
        setStage('swinging')
        setTimeout(() => setStage('falling'), 550)
        setTimeout(() => unlockExtreme(), 550 + 700)
      }
      return next
    })
  }

  return (
    <div className="relative h-14 mb-4">
      <div className={`egg-panel absolute inset-0 bg-[var(--surface)] rounded-lg ${stage}`}>
        {CORNERS.map((corner) => (
          <button
            key={corner}
            type="button"
            onClick={() => clickScrew(corner)}
            style={{ position: 'absolute', ...CORNER_STYLE[corner] }}
            className="egg-screw w-5 h-5 flex items-center justify-center opacity-60 hover:opacity-100"
          >
            <ScrewHead rotation={clicks[corner] * 36} />
          </button>
        ))}
      </div>
    </div>
  )
}
