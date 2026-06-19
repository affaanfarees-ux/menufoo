import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, getDocs, addDoc, updateDoc, collection, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const userRef = doc(db, 'users', result.user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: null, // chosen on /complete-profile
        createdAt: new Date(),
      })
    }
    await fetchUserProfile(result.user.uid)
    return result
  }

  async function setUserRole(role) {
    await setDoc(doc(db, 'users', currentUser.uid), { role }, { merge: true })
    await fetchUserProfile(currentUser.uid)
  }

  function generateFamilyCode() {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
    let code = ''
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    return code
  }

  async function createFamily() {
    let code
    for (let attempts = 0; attempts < 5; attempts++) {
      code = generateFamilyCode()
      const snap = await getDoc(doc(db, 'families', code))
      if (!snap.exists()) break
    }
    await setDoc(doc(db, 'families', code), {
      code,
      createdBy: currentUser.uid,
      createdAt: new Date(),
    })
    await setDoc(doc(db, 'users', currentUser.uid), { familyId: code }, { merge: true })
    await fetchUserProfile(currentUser.uid)
    return code
  }

  async function joinFamily(code) {
    const familyRef = doc(db, 'families', code)
    const snap = await getDoc(familyRef)
    if (!snap.exists()) {
      throw new Error('not-found')
    }
    await setDoc(doc(db, 'users', currentUser.uid), { familyId: code }, { merge: true })
    await fetchUserProfile(currentUser.uid)
  }

  function generateFriendCode() {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
    let code = ''
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    return code
  }

  async function ensureFriendCode() {
    if (userProfile?.friendCode) {
      // Re-sync the lookup doc every time, so it self-heals for codes created
      // before familyId/requireFriendApproval were added, and stays current if
      // requireFriendApproval drifts (e.g. parent toggles it from Settings while
      // this client wasn't connected to receive the friendCodes write directly).
      await setDoc(doc(db, 'friendCodes', userProfile.friendCode), {
        uid: currentUser.uid,
        displayName: userProfile.displayName,
        familyId: userProfile.familyId,
        requireFriendApproval: !!userProfile.requireFriendApproval,
      }, { merge: true })
      return userProfile.friendCode
    }
    let code
    for (let attempts = 0; attempts < 5; attempts++) {
      code = generateFriendCode()
      const snap = await getDoc(doc(db, 'friendCodes', code))
      if (!snap.exists()) break
    }
    await setDoc(doc(db, 'friendCodes', code), {
      uid: currentUser.uid,
      displayName: userProfile.displayName,
      familyId: userProfile.familyId,
      requireFriendApproval: !!userProfile.requireFriendApproval,
      createdAt: new Date(),
    })
    await setDoc(doc(db, 'users', currentUser.uid), { friendCode: code }, { merge: true })
    await fetchUserProfile(currentUser.uid)
    return code
  }

  async function establishFriendship(uidA, nameA, uidB, nameB) {
    const [uid1, uid2] = [uidA, uidB].sort()
    const [displayName1, displayName2] = uid1 === uidA ? [nameA, nameB] : [nameB, nameA]
    await setDoc(doc(db, 'friendships', `${uid1}_${uid2}`), {
      uid1,
      uid2,
      displayName1,
      displayName2,
      createdAt: new Date(),
    })
  }

  async function sendFriendRequest(scannedCode) {
    const codeSnap = await getDoc(doc(db, 'friendCodes', scannedCode))
    if (!codeSnap.exists()) {
      throw new Error('not-found')
    }
    const toInfo = codeSnap.data()
    const toUid = toInfo.uid
    if (toUid === currentUser.uid) {
      throw new Error('self')
    }
    if (toInfo.familyId === undefined || toInfo.requireFriendApproval === undefined) {
      // Code was generated before familyId/requireFriendApproval were added to
      // friendCodes; it self-heals when that student reopens their Friends page.
      throw new Error('stale-code')
    }
    const fromApproved = !userProfile.requireFriendApproval
    const toApproved = !toInfo.requireFriendApproval
    const status = fromApproved && toApproved ? 'accepted' : 'pending'

    await addDoc(collection(db, 'friendRequests'), {
      fromUid: currentUser.uid,
      toUid,
      fromDisplayName: userProfile.displayName,
      toDisplayName: toInfo.displayName,
      fromFamilyId: userProfile.familyId,
      toFamilyId: toInfo.familyId,
      fromApproved,
      toApproved,
      status,
      createdAt: new Date(),
    })

    if (status === 'accepted') {
      await establishFriendship(currentUser.uid, userProfile.displayName, toUid, toInfo.displayName)
    }
    return { status, displayName: toInfo.displayName }
  }

  async function respondToFriendRequest(request, approve) {
    const isFromSide = userProfile.familyId === request.fromFamilyId
    const field = isFromSide ? 'fromApproved' : 'toApproved'

    if (!approve) {
      await updateDoc(doc(db, 'friendRequests', request.id), { status: 'rejected', [field]: false })
      return
    }

    const otherApproved = isFromSide ? request.toApproved : request.fromApproved
    const nowAccepted = otherApproved === true
    await updateDoc(doc(db, 'friendRequests', request.id), {
      [field]: true,
      status: nowAccepted ? 'accepted' : 'pending',
    })

    if (nowAccepted) {
      await establishFriendship(
        request.fromUid, request.fromDisplayName,
        request.toUid, request.toDisplayName
      )
    }
  }

  async function setStudentApproval(studentUid, requireApproval) {
    await updateDoc(doc(db, 'users', studentUid), { requireFriendApproval: requireApproval })
    const codeSnap = await getDocs(query(collection(db, 'friendCodes'), where('uid', '==', studentUid)))
    await Promise.all(codeSnap.docs.map((d) =>
      updateDoc(doc(db, 'friendCodes', d.id), { requireFriendApproval: requireApproval })
    ))
  }

  function logout() {
    return signOut(auth)
  }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      setUserProfile({ id: snap.id, ...snap.data() })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserProfile(user.uid)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    loginWithGoogle,
    setUserRole,
    createFamily,
    joinFamily,
    ensureFriendCode,
    sendFriendRequest,
    respondToFriendRequest,
    setStudentApproval,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
