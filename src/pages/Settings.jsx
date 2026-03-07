import { useTheme } from '../context/ThemeContext'

const SWATCH_PREVIEWS = {
  default: 'bg-[#1a1a2e]',
  red:     'bg-[#1a0a0a]',
  blue:    'bg-[#0a0f1a]',
  yellow:  'bg-[#1a1600]',
  orange:  'bg-[#1a0d00]',
  green:   'bg-[#001a0a]',
  purple:  'bg-[#0f001a]',
}

const BORDER_PREVIEWS = {
  default: 'border-[#0f3460]',
  red:     'border-[#3d0f0f]',
  blue:    'border-[#0f2060]',
  yellow:  'border-[#3d3200]',
  orange:  'border-[#3d1f00]',
  green:   'border-[#003d1a]',
  purple:  'border-[#25003d]',
}

export default function Settings() {
  const { colorId, setColor, COLORS } = useTheme()

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-2">Settings</h1>
      <p className="text-green-300/60 text-sm mb-8">Customize how MenuFoo looks for you.</p>

      <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
        <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-4">
          Background Color
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => setColor(color.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                colorId === color.id
                  ? 'border-green-400 bg-green-400/10'
                  : 'border-green-400/20 hover:border-green-400/50'
              }`}
            >
              {/* Swatch preview */}
              <div className={`w-8 h-8 rounded-lg border-4 flex-shrink-0 ${SWATCH_PREVIEWS[color.id]} ${BORDER_PREVIEWS[color.id]}`} />
              <span className="text-white text-sm font-bold">{color.label}</span>
              {colorId === color.id && (
                <span className="absolute top-1.5 right-2 text-green-400 text-xs font-black">✓</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-green-300/40 text-xs mt-4">
          Your choice is saved automatically and only affects your device.
        </p>
      </div>
    </div>
  )
}
