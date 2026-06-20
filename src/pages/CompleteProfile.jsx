import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RELATIONSHIP_OPTIONS } from '../constants/family'

function Shell({ children, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black text-green-400 text-center mb-2 tracking-widest">
          🍱 MenuFoo
        </h1>
        <p className="text-center text-green-300/60 mb-8 text-sm">{subtitle}</p>
        <div className="bg-[#0f3460] rounded-2xl p-8 border border-green-400/20">
          {children}
        </div>
      </div>
    </div>
  )
}

function RoleStep({ onSubmit, loading, error }) {
  const [role, setRole] = useState('student')
  return (
    <Shell subtitle="One more step.">
      <h2 className="text-xl font-bold text-white mb-6">I am a...</h2>
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(role) }} className="flex flex-col gap-4">
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
              {r === 'student' ? '🎒 Student' : '👨‍👩‍👧 Guardian'}
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
    </Shell>
  )
}

function JoinFamilyForm({ onSubmit, loading, error, label = 'Family Code' }) {
  const [code, setCode] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(code.trim().toUpperCase()) }} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-green-300 text-sm font-semibold mb-1">{label}</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={6}
          className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-2.5 text-white tracking-widest font-bold uppercase focus:outline-none focus:border-green-400 transition-colors"
          placeholder="ABC123"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join Family'}
      </button>
    </form>
  )
}

function StudentFamilyStep({ onJoin, loading, error }) {
  return (
    <Shell subtitle="Almost there — ask your guardian for your family code.">
      <h2 className="text-xl font-bold text-white mb-6">Enter Family Code</h2>
      <JoinFamilyForm onSubmit={onJoin} loading={loading} error={error} />
    </Shell>
  )
}

function GuardianInfoFields({ relationship, setRelationship, isPrimaryGuardian, setIsPrimaryGuardian }) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div>
        <label className="block text-green-300 text-sm font-semibold mb-1">
          Your relationship to the kids (optional)
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-400 transition-colors"
        >
          <option value="">Prefer not to say</option>
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-green-300 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isPrimaryGuardian}
          onChange={(e) => setIsPrimaryGuardian(e.target.checked)}
          className="w-4 h-4 accent-green-400"
        />
        I'm the primary guardian
      </label>
    </div>
  )
}

function ParentFamilyStep({ onCreate, onJoin, loading, error, createdCode, onContinue }) {
  const [mode, setMode] = useState('create')
  const [relationship, setRelationship] = useState('')
  const [isPrimaryGuardian, setIsPrimaryGuardian] = useState(false)
  const guardianInfo = { relationship, isPrimaryGuardian }

  if (createdCode) {
    return (
      <Shell subtitle="Your family is ready.">
        <h2 className="text-xl font-bold text-white mb-4">Share this code</h2>
        <div className="bg-[#16213e] border border-green-400/30 rounded-lg py-6 text-center mb-4">
          <span className="text-3xl font-black text-green-400 tracking-widest">{createdCode}</span>
        </div>
        <p className="text-green-300/60 text-sm mb-6">
          Give this code to your kids (and any co-guardian) so they can join your family.
          You can find it again later in Settings.
        </p>
        <button
          onClick={onContinue}
          className="w-full bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors"
        >
          Continue
        </button>
      </Shell>
    )
  }

  return (
    <Shell subtitle="Set up your family.">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
            mode === 'create' ? 'bg-green-400 text-[#0f3460]' : 'bg-transparent text-green-300 border border-green-400/30'
          }`}
        >
          Create New
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
            mode === 'join' ? 'bg-green-400 text-[#0f3460]' : 'bg-transparent text-green-300 border border-green-400/30'
          }`}
        >
          Join Existing
        </button>
      </div>

      <GuardianInfoFields
        relationship={relationship}
        setRelationship={setRelationship}
        isPrimaryGuardian={isPrimaryGuardian}
        setIsPrimaryGuardian={setIsPrimaryGuardian}
      />

      {mode === 'create' ? (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          <p className="text-green-300/60 text-sm">
            Creates a new family code that you'll share with your kids and any co-guardian.
          </p>
          <button
            onClick={() => onCreate(guardianInfo)}
            disabled={loading}
            className="bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Family Code'}
          </button>
        </div>
      ) : (
        <JoinFamilyForm
          onSubmit={(code) => onJoin(code, guardianInfo)}
          loading={loading}
          error={error}
          label="Family Code (from a co-guardian)"
        />
      )}
    </Shell>
  )
}

export default function CompleteProfile() {
  const { userProfile, setUserRole, createFamily, joinFamily, setGuardianInfo } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdCode, setCreatedCode] = useState(null)

  async function handleRoleSubmit(role) {
    setError('')
    setLoading(true)
    try {
      await setUserRole(role)
    } catch {
      setError('Failed to save your role. Please try again.')
    }
    setLoading(false)
  }

  async function handleCreateFamily(guardianInfo) {
    setError('')
    setLoading(true)
    try {
      const code = await createFamily()
      await setGuardianInfo(guardianInfo)
      setCreatedCode(code)
    } catch {
      setError('Failed to create your family. Please try again.')
    }
    setLoading(false)
  }

  async function handleJoinFamily(code, guardianInfo) {
    setError('')
    setLoading(true)
    try {
      await joinFamily(code)
      if (guardianInfo) await setGuardianInfo(guardianInfo)
      navigate('/lunches')
    } catch (err) {
      setError(err.message === 'not-found' ? "That family code doesn't exist." : 'Failed to join family. Please try again.')
    }
    setLoading(false)
  }

  if (!userProfile?.role) {
    return <RoleStep onSubmit={handleRoleSubmit} loading={loading} error={error} />
  }

  if (userProfile.role === 'parent') {
    return (
      <ParentFamilyStep
        onCreate={handleCreateFamily}
        onJoin={handleJoinFamily}
        loading={loading}
        error={error}
        createdCode={createdCode}
        onContinue={() => navigate('/lunches')}
      />
    )
  }

  return <StudentFamilyStep onJoin={handleJoinFamily} loading={loading} error={error} />
}
