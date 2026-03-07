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

  return (
    <ThemeContext.Provider value={{ colorId, setColor, current, COLORS }}>
      {children}
    </ThemeContext.Provider>
  )
}
