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
  const { colorId, setColor, COLORS, cubeEnabled, toggleCube, obstaclesEnabled, toggleObstacles } = useTheme()

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Settings</h1>
        <p className="text-green-300/60 text-sm">Customize how MenuFoo looks for you.</p>
      </div>

      {/* Background color */}
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
              <div className={`w-8 h-8 rounded-lg border-4 flex-shrink-0 ${SWATCH_PREVIEWS[color.id]} ${BORDER_PREVIEWS[color.id]}`} />
              <span className="text-white text-sm font-bold">{color.label}</span>
              {colorId === color.id && (
                <span className="absolute top-1.5 right-2 text-green-400 text-xs font-black">✓</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-green-300/40 text-xs mt-4">
          Saved automatically — only affects your device.
        </p>
      </div>

      {/* Physics cube */}
      <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
        <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-1">
          Fun Stuff
        </h2>
        <p className="text-green-300/50 text-xs mb-4">Just for fun. Has no effect on your data.</p>

        <button
          onClick={toggleCube}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            cubeEnabled
              ? 'border-green-400 bg-green-400/10'
              : 'border-green-400/20 hover:border-green-400/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟥</span>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Rainbow Physics Cube</p>
              <p className="text-green-300/50 text-xs">A bouncy cube you can throw around the screen</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-3 ${cubeEnabled ? 'bg-green-400' : 'bg-green-400/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${cubeEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </button>

        <button
          onClick={toggleObstacles}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all mt-3 ${
            obstaclesEnabled
              ? 'border-green-400 bg-green-400/10'
              : 'border-green-400/20 hover:border-green-400/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟦</span>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Obstacles</p>
              <p className="text-green-300/50 text-xs">4 random draggable blocks that bounce the cube</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-3 ${obstaclesEnabled ? 'bg-green-400' : 'bg-green-400/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${obstaclesEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  )
}
