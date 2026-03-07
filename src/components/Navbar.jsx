import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/lunches', label: 'Lunches', roles: ['student', 'parent'] },
  { to: '/calendar', label: 'Calendar', roles: ['student', 'parent'] },
  { to: '/recommend', label: 'Recommendations', roles: ['student', 'parent'] },
  { to: '/planner', label: 'Weekly Planner', roles: ['parent'] },
  { to: '/shopping', label: 'Shopping List', roles: ['parent'] },
]

export default function Navbar() {
  const { userProfile, logout } = useAuth()
  const location = useLocation()

  const role = userProfile?.role
  const visible = navItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="bg-[#0f3460] border-b-2 border-green-400 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-2xl font-black text-green-400 tracking-widest no-underline">
        🍱 MenuFoo
      </Link>

      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3 ml-4 border-l border-green-400/30 pl-4">
          <span className="text-green-300 text-sm font-semibold">
            {userProfile?.displayName}
            <span className="ml-1 text-xs text-green-500 opacity-70">
              ({role})
            </span>
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
