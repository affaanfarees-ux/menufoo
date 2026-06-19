import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CompleteProfile() {
  const { currentUser, setUserRole } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await setUserRole(role)
      navigate('/lunches')
    } catch {
      setError('Failed to save your profile. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2 tracking-widest">
          🍱 MenuFoo
        </h1>
        <p className="text-center text-green-300/60 mb-8 text-sm">
          Welcome, {currentUser?.displayName?.split(' ')[0] || 'there'}! One more step.
        </p>

        <div className="bg-[#0f3460] rounded-2xl p-8 border border-green-400/20">
          <h2 className="text-xl font-bold text-white mb-6">I am a...</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              {['student', 'parent'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm capitalize transition-colors border ${
                    role === r
                      ? 'bg-green-400 text-[#0f3460] border-green-400'
                      : 'bg-transparent text-green-300 border-green-400/30 hover:border-green-400/60'
                  }`}
                >
                  {r === 'student' ? '🎒 Student' : '👨‍👩‍👧 Parent'}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
