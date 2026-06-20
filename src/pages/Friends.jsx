import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, onSnapshot, query, or, where } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import QrScanner from '../components/QrScanner'

export default function Friends() {
  const { currentUser, userProfile, ensureFriendCode, sendFriendRequest } = useAuth()
  const friendCode = userProfile?.friendCode || null
  const [friends, setFriends] = useState([])
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }
  const requestedCodeRef = useRef(false)

  useEffect(() => {
    // Always call this on mount, even if a code already exists -- ensureFriendCode
    // resyncs familyId/requireFriendApproval onto the existing code every time,
    // not just on first creation.
    if (requestedCodeRef.current) return
    requestedCodeRef.current = true
    ensureFriendCode()
  }, [ensureFriendCode])

  useEffect(() => {
    const q = query(
      collection(db, 'friendships'),
      or(where('uid1', '==', currentUser.uid), where('uid2', '==', currentUser.uid))
    )
    const unsub = onSnapshot(q, (snap) => {
      setFriends(snap.docs.map((d) => {
        const data = d.data()
        const isUid1 = data.uid1 === currentUser.uid
        return {
          id: d.id,
          uid: isUid1 ? data.uid2 : data.uid1,
          displayName: isUid1 ? data.displayName2 : data.displayName1,
        }
      }))
    })
    return unsub
  }, [currentUser.uid])

  const handleScan = useCallback(async (scannedCode) => {
    setScanning(false)
    try {
      const { status, displayName } = await sendFriendRequest(scannedCode)
      setMessage(
        status === 'accepted'
          ? { type: 'success', text: `You and ${displayName} are now friends!` }
          : { type: 'success', text: `Friend request sent to ${displayName}. Waiting on approval.` }
      )
    } catch (err) {
      console.error('sendFriendRequest failed:', err)
      const text =
        err.message === 'self' ? "That's your own code!" :
        err.message === 'not-found' ? 'Invalid or expired QR code.' :
        err.message === 'stale-code' ? "This friend's code needs refreshing — ask them to reopen their Friends page, then scan again." :
        'Could not send friend request. Please try again.'
      setMessage({ type: 'error', text })
    }
  }, [sendFriendRequest])

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Friends</h1>
        <p className="text-green-300/60 text-sm">Connect with friends by scanning their QR code.</p>
      </div>

      {/* My QR code */}
      <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6 flex flex-col items-center">
        <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-4 self-start">
          My Code
        </h2>
        {friendCode ? (
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={friendCode} size={180} />
          </div>
        ) : (
          <p className="text-green-300/50 text-sm py-8">Generating your code...</p>
        )}
        <p className="text-green-300/50 text-xs mt-3">Have a friend scan this in their app.</p>
      </div>

      {/* Add friend */}
      <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
        <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-4">
          Add Friend
        </h2>

        {message && (
          <div className={`rounded-lg p-3 mb-4 text-sm border ${
            message.type === 'success'
              ? 'bg-green-400/10 border-green-400/30 text-green-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {scanning ? (
          <div className="flex flex-col gap-3">
            <QrScanner onScan={handleScan} onError={() => setMessage({ type: 'error', text: 'Could not access camera.' })} />
            <button
              onClick={() => setScanning(false)}
              className="text-green-300 text-sm font-bold hover:text-green-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setMessage(null); setScanning(true) }}
            className="w-full bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors"
          >
            📷 Scan a Friend's Code
          </button>
        )}
      </div>

      {/* Friends list */}
      <div className="bg-[var(--surface)] rounded-2xl border border-green-400/20 p-6">
        <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-4">
          Your Friends {friends.length > 0 && `(${friends.length})`}
        </h2>
        {friends.length === 0 ? (
          <p className="text-green-300/40 text-sm">No friends yet. Scan a code to add one!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-[#16213e] rounded-lg px-4 py-2.5">
                <span className="text-white font-semibold text-sm">{f.displayName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
