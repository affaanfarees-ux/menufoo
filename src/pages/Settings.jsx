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
  const { colorId, setColor, COLORS, cubeEnabled, toggleCube, obstaclesEnabled, toggleObstacles, obstacleCount, setObstacleCount, specialObstacles, toggleSpecialObstacles } = useTheme()

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

        <div className="mt-3">
          <button
            onClick={toggleObstacles}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              obstaclesEnabled
                ? 'border-green-400 bg-green-400/10 rounded-b-none border-b-0'
                : 'border-green-400/20 hover:border-green-400/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🟦</span>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Obstacles</p>
                <p className="text-green-300/50 text-xs">Draggable blocks that interact with the cube</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-3 ${obstaclesEnabled ? 'bg-green-400' : 'bg-green-400/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${obstaclesEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>

          {obstaclesEnabled && (
            <div className="border-2 border-t-0 border-green-400 bg-green-400/5 rounded-b-xl px-4 py-4 flex flex-col gap-4">
              {/* Count slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-300/70 text-xs font-bold uppercase tracking-wider">Number of obstacles</span>
                  <span className="text-green-400 font-black text-sm">{obstacleCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={obstacleCount}
                  onChange={(e) => setObstacleCount(parseInt(e.target.value, 10))}
                  className="w-full accent-green-400 cursor-pointer"
                />
                <div className="flex justify-between text-green-300/30 text-xs mt-1">
                  <span>1</span><span>7</span>
                </div>
              </div>

              {/* Special / plain toggle */}
              <div>
                <p className="text-green-300/70 text-xs font-bold uppercase tracking-wider mb-2">Mode</p>
                <button
                  onClick={toggleSpecialObstacles}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    specialObstacles
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-green-400/20 hover:border-green-400/40'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{specialObstacles ? '✨ Special Obstacles' : '⬜ Plain Cubes'}</p>
                    <p className="text-green-300/50 text-xs">
                      {specialObstacles ? 'Space invader follower + icy hexagon zone' : 'All obstacles are simple draggable blocks'}
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-3 ${specialObstacles ? 'bg-green-400' : 'bg-green-400/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${specialObstacles ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
