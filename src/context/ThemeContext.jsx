import { createContext, useContext, useState, useEffect } from 'react'

const COLORS = [
  { id: 'default',  label: 'Dark Navy',  bg: '#1a1a2e', surface: '#0f3460' },
  { id: 'red',      label: 'Red',        bg: '#1a0a0a', surface: '#3d0f0f' },
  { id: 'blue',     label: 'Blue',       bg: '#0a0f1a', surface: '#0f2060' },
  { id: 'yellow',   label: 'Yellow',     bg: '#1a1600', surface: '#3d3200' },
  { id: 'orange',   label: 'Orange',     bg: '#1a0d00', surface: '#3d1f00' },
  { id: 'green',    label: 'Green',      bg: '#001a0a', surface: '#003d1a' },
  { id: 'purple',   label: 'Purple',     bg: '#0f001a', surface: '#25003d' },
]

export { COLORS }

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [colorId, setColorId] = useState(() => localStorage.getItem('mf_color') || 'default')
  const [cubeEnabled, setCubeEnabled] = useState(() => localStorage.getItem('mf_cube') === 'true')
  const [obstaclesEnabled, setObstaclesEnabled] = useState(() => localStorage.getItem('mf_obs') === 'true')
  const [obstacleCount, setObstacleCountState] = useState(() => parseInt(localStorage.getItem('mf_obs_count') || '4', 10))
  const [specialObstacles, setSpecialObstacles] = useState(() => localStorage.getItem('mf_obs_special') !== 'false')

  // Not persisted — the secret panel resets to hidden on every page reload.
  const [extremeUnlocked, setExtremeUnlockedState] = useState(false)
  const [cubeRotate, setCubeRotate] = useState(() => localStorage.getItem('mf_cube_rotate') === 'true')
  const [cubeFace, setCubeFace] = useState(() => localStorage.getItem('mf_cube_face') === 'true')
  const [bonkMode, setBonkMode] = useState(() => localStorage.getItem('mf_bonk') === 'true')
  const [cubeSizeOverride, setCubeSizeOverrideState] = useState(() => {
    const v = localStorage.getItem('mf_cube_size_override')
    return v ? parseInt(v, 10) : null
  })

  const current = COLORS.find((c) => c.id === colorId) || COLORS[0]

  useEffect(() => {
    document.documentElement.style.setProperty('--bg', current.bg)
    document.documentElement.style.setProperty('--surface', current.surface)
    document.body.style.backgroundColor = current.bg
  }, [current])

  function setColor(id) {
    setColorId(id)
    localStorage.setItem('mf_color', id)
  }

  function toggleCube() {
    setCubeEnabled((prev) => {
      localStorage.setItem('mf_cube', !prev)
      return !prev
    })
  }

  function toggleObstacles() {
    setObstaclesEnabled((prev) => {
      localStorage.setItem('mf_obs', !prev)
      return !prev
    })
  }

  function setObstacleCount(n) {
    setObstacleCountState(n)
    localStorage.setItem('mf_obs_count', n)
  }

  function toggleSpecialObstacles() {
    setSpecialObstacles((prev) => {
      localStorage.setItem('mf_obs_special', !prev)
      return !prev
    })
  }

  function unlockExtreme() {
    setExtremeUnlockedState(true)
  }

  function toggleCubeRotate() {
    setCubeRotate((prev) => {
      localStorage.setItem('mf_cube_rotate', !prev)
      return !prev
    })
  }

  function toggleCubeFace() {
    setCubeFace((prev) => {
      localStorage.setItem('mf_cube_face', !prev)
      return !prev
    })
  }

  function toggleBonkMode() {
    setBonkMode((prev) => {
      localStorage.setItem('mf_bonk', !prev)
      return !prev
    })
  }

  function setCubeSizeOverride(n) {
    setCubeSizeOverrideState(n)
    if (n == null) {
      localStorage.removeItem('mf_cube_size_override')
    } else {
      localStorage.setItem('mf_cube_size_override', String(n))
    }
  }

  return (
    <ThemeContext.Provider value={{
      colorId, setColor, current, COLORS,
      cubeEnabled, toggleCube,
      obstaclesEnabled, toggleObstacles,
      obstacleCount, setObstacleCount,
      specialObstacles, toggleSpecialObstacles,
      extremeUnlocked, unlockExtreme,
      cubeRotate, toggleCubeRotate,
      cubeFace, toggleCubeFace,
      bonkMode, toggleBonkMode,
      cubeSizeOverride, setCubeSizeOverride,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
