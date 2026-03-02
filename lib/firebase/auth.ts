import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type ActionCodeSettings,
  type OAuthCredential,
  type User,
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

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )

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

export const loginWithGoogleCredential = async (
  credential: OAuthCredential,
) => {
  if (!auth) throw new Error('Firebase auth not initialized')
  if (!firestore) throw new Error('Firestore not initialized')

  const userCredential = await signInWithCredential(auth, credential)

  // Create or update user document in Firestore
  await createOrUpdateUserInFirestore(firestore, userCredential.user)

  return userCredential
}

export const sendPasswordReset = async (email: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')
  await sendPasswordResetEmail(auth, email)
}

export const sendEmailLink = async (
  email: string,
  actionCodeSettings: ActionCodeSettings,
) => {
  if (!auth) throw new Error('Firebase auth not initialized')

  await sendSignInLinkToEmail(auth, email, actionCodeSettings)

  // Store email in localStorage for later use when user clicks the link
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email)
  }
}

/**
 * Fallback: detect Firebase email link params in URL when isSignInWithEmailLink
 * returns false (e.g. redirect quirks, hash vs query). Checks for oobCode and
 * mode=signIn in query or hash.
 */
export function hasEmailLinkParams(url: string): boolean {
  try {
    const hasParams = (s: string) => {
      const params = new URLSearchParams(s)
      const oob = params.get('oobCode')
      return params.get('mode') === 'signIn' && oob != null && oob.length > 0
    }
    const q = url.indexOf('?')
    const h = url.indexOf('#')
    if (q !== -1) {
      const query = h !== -1 ? url.slice(q + 1, h) : url.slice(q + 1)
      if (hasParams(query)) return true
    }
    if (h !== -1 && hasParams(url.slice(h + 1))) return true
    return false
  } catch {
    return false
  }
}

export const checkIsEmailLink = (emailLink?: string): boolean => {
  if (!auth) return false
  const link = emailLink || (typeof window !== 'undefined' ? window.location.href : undefined)
  if (!link) return false
  return isSignInWithEmailLink(auth, link)
}

export const loginWithEmailLink = async (
  email: string,
  emailLink?: string,
) => {
  if (!auth) throw new Error('Firebase auth not initialized')
  if (!firestore) throw new Error('Firestore not initialized')

  // If emailLink is not provided, use the current URL
  const link = emailLink || (typeof window !== 'undefined' ? window.location.href : undefined)
  if (!link) {
    throw new Error('Email link is required. Provide emailLink parameter or ensure user is on the page with the email link.')
  }

  const userCredential = await signInWithEmailLink(auth, email, link)

  // Create or update user document in Firestore
  await createOrUpdateUserInFirestore(firestore, userCredential.user)

  // Clear email from localStorage after successful sign-in
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('emailForSignIn')
  }

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
