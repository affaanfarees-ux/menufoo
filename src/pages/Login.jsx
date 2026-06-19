import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-2.9 5.3-5.4 6.9l6.3 5.3C39.9 37.5 44 31.6 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  )
}

export default function Login() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/lunches')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.')
      }
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
          <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#16213e] font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-center text-green-300/60 text-xs mt-6">
            New here? Signing in with Google creates your account automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
