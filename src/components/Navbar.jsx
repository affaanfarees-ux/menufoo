import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/lunches', label: 'Lunches', roles: ['student', 'parent'] },
  { to: '/calendar', label: 'Calendar', roles: ['student', 'parent'] },
  { to: '/recommend', label: 'Recommendations', roles: ['student', 'parent'] },
  { to: '/planner', label: 'Weekly Planner', roles: ['parent'] },
  { to: '/shopping', label: 'Shopping List', roles: ['parent'] },
  { to: '/settings', label: '⚙ Settings', roles: ['student', 'parent'] },
]

export default function Navbar() {
  const { userProfile, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const role = userProfile?.role
  const visible = navItems.filter((item) => item.roles.includes(role))

  function closeMenu() { setMenuOpen(false) }

  return (
    <nav className="bg-[#0f3460] border-b-2 border-green-400 px-4 py-3 relative">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-black text-green-400 tracking-widest no-underline">
          🍱 MenuFoo
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          {visible.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded font-bold text-sm transition-colors no-underline ${
                location.pathname.startsWith(item.to)
                  ? 'bg-green-400 text-[#0f3460]'
                  : 'text-green-300 hover:bg-green-400/20'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-2 border-l border-green-400/30 pl-3">
            <span className="text-green-300 text-sm font-semibold">
              {userProfile?.displayName}
              <span className="ml-1 text-xs text-green-500 opacity-70">({role})</span>
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 text-sm font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-green-400 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-green-400 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-green-400 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0f3460] border-b-2 border-green-400 z-50 px-4 py-3 flex flex-col gap-2">
          {visible.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors no-underline ${
                location.pathname.startsWith(item.to)
                  ? 'bg-green-400 text-[#0f3460]'
                  : 'text-green-300 hover:bg-green-400/20'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-green-400/20 pt-2 mt-1 flex items-center justify-between">
            <span className="text-green-300 text-sm font-semibold">
              {userProfile?.displayName}
              <span className="ml-1 text-xs text-green-500 opacity-70">({role})</span>
            </span>
            <button
              onClick={() => { closeMenu(); logout() }}
              className="px-3 py-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
