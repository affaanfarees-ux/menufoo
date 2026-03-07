import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }
    setLoading(true)
    try {
      await signup(email, password, displayName, role)
      navigate('/lunches')
    } catch (err) {
      setError('Failed to create account. That email may already be in use.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2 tracking-widest">
          🍱 MenuFoo
        </h1>
        <p className="text-center text-green-300/60 mb-8 text-sm">Create your account</p>

        <div className="bg-[#0f3460] rounded-2xl p-8 border border-green-400/20">
          <h2 className="text-xl font-bold text-white mb-6">Sign Up</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400 transition-colors"
                placeholder="e.g. Alex"
              />
            </div>
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
                placeholder="at least 6 characters"
              />
            </div>
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-2">I am a...</label>
              <div className="flex gap-3">
                {['student', 'parent'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm capitalize transition-colors border ${
                      role === r
                        ? 'bg-green-400 text-[#0f3460] border-green-400'
                        : 'bg-transparent text-green-300 border-green-400/30 hover:border-green-400/60'
                    }`}
                  >
                    {r === 'student' ? '🎒 Student' : '👨‍👩‍👧 Parent'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-green-300/60 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 font-bold hover:text-green-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
