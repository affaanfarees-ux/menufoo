import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
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
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
