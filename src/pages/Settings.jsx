import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { RELATIONSHIP_OPTIONS } from '../constants/family'
import SecretPanel from '../components/SecretPanel'

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

function GuardianInfo({ userProfile }) {
  const { setGuardianInfo } = useAuth()
  const [relationship, setRelationship] = useState(userProfile.relationship || '')
  const [isPrimaryGuardian, setIsPrimaryGuardian] = useState(!!userProfile.isPrimaryGuardian)
  const [saved, setSaved] = useState(false)

  async function save(next) {
    setSaved(false)
    await setGuardianInfo(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
      <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-1">
        Guardian Info
      </h2>
      <p className="text-green-300/50 text-xs mb-4">
        Optional — helps with assigning responsibilities by relationship later.
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-green-300 text-sm font-semibold mb-1">
            Your relationship to the kids
          </label>
          <select
            value={relationship}
            onChange={(e) => {
              setRelationship(e.target.value)
              save({ relationship: e.target.value, isPrimaryGuardian })
            }}
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
            onChange={(e) => {
              setIsPrimaryGuardian(e.target.checked)
              save({ relationship, isPrimaryGuardian: e.target.checked })
            }}
            className="w-4 h-4 accent-green-400"
          />
          I'm the primary guardian
          {saved && <span className="text-green-400 text-xs ml-2">Saved!</span>}
        </label>
      </div>
    </div>
  )
}

function FriendSettings({ familyId }) {
  const { setStudentApproval, respondToFriendRequest } = useAuth()
  const [students, setStudents] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('familyId', '==', familyId),
      where('role', '==', 'student')
    )
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => console.error('Failed to load students:', err))
    return unsub
  }, [familyId])

  useEffect(() => {
    // Two plain equality queries merged client-side, rather than one and(or(...))
    // query — Firestore's or() composite filters often require a manually
    // created index, while multi-field equality-only queries don't.
    const results = { from: [], to: [] }
    function recompute() {
      const merged = new Map()
      ;[...results.from, ...results.to].forEach((r) => merged.set(r.id, r))
      const needsAction = [...merged.values()].filter((r) =>
        (r.fromFamilyId === familyId && !r.fromApproved) ||
        (r.toFamilyId === familyId && !r.toApproved)
      )
      setPendingRequests(needsAction)
    }

    const qFrom = query(
      collection(db, 'friendRequests'),
      where('status', '==', 'pending'),
      where('fromFamilyId', '==', familyId)
    )
    const qTo = query(
      collection(db, 'friendRequests'),
      where('status', '==', 'pending'),
      where('toFamilyId', '==', familyId)
    )
    const unsubFrom = onSnapshot(qFrom, (snap) => {
      results.from = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      recompute()
    }, (err) => console.error('Failed to load pending friend requests (from side):', err))
    const unsubTo = onSnapshot(qTo, (snap) => {
      results.to = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      recompute()
    }, (err) => console.error('Failed to load pending friend requests (to side):', err))

    return () => { unsubFrom(); unsubTo() }
  }, [familyId])

  if (students.length === 0) return null

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
      <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-1">
        Friend Requests
      </h2>
      <p className="text-green-300/50 text-xs mb-4">
        Control whether each student needs your approval before connecting with a new friend.
      </p>

      <div className="flex flex-col gap-2 mb-2">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between bg-[#16213e] border border-green-400/20 rounded-lg px-4 py-3"
          >
            <span className="text-white font-semibold text-sm">{student.displayName}</span>
            <button
              onClick={() => setStudentApproval(student.id, !student.requireFriendApproval)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                student.requireFriendApproval
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                  : 'bg-green-400/20 text-green-300 border border-green-400/40'
              }`}
            >
              {student.requireFriendApproval ? 'Approval Required' : 'Automatic'}
            </button>
          </div>
        ))}
      </div>

      {pendingRequests.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-green-300/70 text-xs font-bold uppercase tracking-wider">
            Pending Approval
          </p>
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-3">
              <p className="text-white text-sm mb-2">
                <span className="font-bold">{req.fromDisplayName}</span> wants to add{' '}
                <span className="font-bold">{req.toDisplayName}</span> as a friend
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => respondToFriendRequest(req, true)}
                  className="flex-1 bg-green-400 text-[#0f3460] font-bold text-xs py-2 rounded-lg hover:bg-green-300 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => respondToFriendRequest(req, false)}
                  className="flex-1 bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs py-2 rounded-lg hover:bg-red-500/40 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToggleRow({ icon, label, desc, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
        active ? 'border-purple-400 bg-purple-400/10' : 'border-purple-400/20 hover:border-purple-400/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div className="text-left">
          <p className="text-white font-bold text-sm">{label}</p>
          <p className="text-purple-300/50 text-xs">{desc}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-3 ${active ? 'bg-purple-400' : 'bg-purple-400/20'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  )
}

function ExtremeSettings() {
  const {
    cubeRotate, toggleCubeRotate,
    cubeFace, toggleCubeFace,
    bonkMode, toggleBonkMode,
    cubeSizeOverride, setCubeSizeOverride,
  } = useTheme()

  return (
    <div className="border-2 border-purple-400/30 bg-purple-400/5 rounded-xl p-4 mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-purple-300 text-xs font-black uppercase tracking-widest">🔓 Extreme Settings</p>
        <p className="text-orange-300/80 text-[11px] font-bold">⚠️ Might glitch, be careful</p>
      </div>
      <p className="text-purple-300/50 text-xs -mt-2">You found the secret panel. Nice.</p>

      <ToggleRow
        icon="🌀"
        label="Tumbling Cube"
        desc="The cube spins as it rolls and bounces"
        active={cubeRotate}
        onClick={toggleCubeRotate}
      />
      <ToggleRow
        icon="🙂"
        label="Smiley Face"
        desc="Gives the cube a face"
        active={cubeFace}
        onClick={toggleCubeFace}
      />
      <ToggleRow
        icon="💥"
        label="Bonk Mode"
        desc="Impacts push the cube back harder the faster it's going"
        active={bonkMode}
        onClick={toggleBonkMode}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-bold text-sm">Cube Size</p>
          <button
            onClick={() => setCubeSizeOverride(null)}
            className="text-purple-300/60 hover:text-purple-300 text-xs font-bold"
          >
            Reset to auto
          </button>
        </div>
        <input
          type="range"
          min={40}
          max={500}
          value={cubeSizeOverride ?? 288}
          onChange={(e) => setCubeSizeOverride(parseInt(e.target.value, 10))}
          className="w-full accent-purple-400"
        />
        <p className="text-purple-300/50 text-xs mt-1">
          {cubeSizeOverride ? `${cubeSizeOverride}px (fixed)` : 'Auto (scales with your screen)'}
        </p>
      </div>
    </div>
  )
}

export default function Settings() {
  const {
    colorId, setColor, COLORS,
    cubeEnabled, toggleCube,
    obstaclesEnabled, toggleObstacles,
    specialObstacles, toggleSpecialObstacles,
    extremeUnlocked,
  } = useTheme()
  const { userProfile } = useAuth()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(userProfile.familyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Settings</h1>
        <p className="text-green-300/60 text-sm">Customize how MenuFoo looks for you.</p>
      </div>

      {/* Family code */}
      {userProfile?.familyId && (
        <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
          <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-1">
            Family
          </h2>
          <p className="text-green-300/50 text-xs mb-4">
            Share this code so a guardian or student can join your family.
          </p>
          <button
            onClick={copyCode}
            className="w-full flex items-center justify-between bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-3 hover:border-green-400/60 transition-colors"
          >
            <span className="text-2xl font-black text-green-400 tracking-widest">{userProfile.familyId}</span>
            <span className="text-green-300 text-xs font-bold">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Guardian info (parent only) */}
      {userProfile?.role === 'parent' && (
        <GuardianInfo userProfile={userProfile} />
      )}

      {/* Friend request controls (parent only) */}
      {userProfile?.role === 'parent' && userProfile?.familyId && (
        <FriendSettings familyId={userProfile.familyId} />
      )}

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

        {extremeUnlocked ? <ExtremeSettings /> : <SecretPanel />}

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
