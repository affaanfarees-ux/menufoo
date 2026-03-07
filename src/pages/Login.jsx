import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/lunches')
    } catch (err) {
      setError('Failed to sign in. Check your email and password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2 tracking-widest">
          🍱 MenuFoo
        </h1>
        <p className="text-center text-green-300/60 mb-8 text-sm">Track your school lunches</p>

        <div className="bg-[#0f3460] rounded-2xl p-8 border border-green-400/20">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400 transition-colors"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-green-300/60 text-sm mt-6">
            No account?{' '}
            <Link to="/signup" className="text-green-400 font-bold hover:text-green-300">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
