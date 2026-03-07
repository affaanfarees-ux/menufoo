import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Replace these with your Firebase project config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyD8iXa3wpeGkxd05_Zq13F2D8spPfWCRCk",
  authDomain: "menufoo-487c7.firebaseapp.com",
  projectId: "menufoo-487c7",
  storageBucket: "menufoo-487c7.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
