import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import {auth, firestore} from './config'
import {createOrUpdateUserInFirestore} from './users'

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')
  if (!firestore) throw new Error('Firestore not initialized')
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Ensure user exists in Firestore (in case they were created before this feature)
  await createOrUpdateUserInFirestore(firestore, userCredential.user)
  
  return userCredential
}

export const signupWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')
  if (!firestore) throw new Error('Firestore not initialized')
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Create user document in Firestore
  await createOrUpdateUserInFirestore(firestore, userCredential.user)
  
  return userCredential
}

export const loginWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth not initialized')
  if (!firestore) throw new Error('Firestore not initialized')
  
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  
  // Create or update user document in Firestore
  await createOrUpdateUserInFirestore(firestore, userCredential.user)
  
  return userCredential
}

export const logout = async () => {
  if (!auth) throw new Error('Firebase auth not initialized')
  return signOut(auth)
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export const getCurrentUser = () => {
  if (!auth) return null
  return auth.currentUser
}

