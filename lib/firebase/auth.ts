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

export const getPostEmailLinkRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return '/lobby'
  }

  return new URL('/lobby', window.location.origin).toString()
}

const syncUserProfileAfterSignIn = async (
  user: User,
  options: {
    blocking?: boolean
    reason?: string
  } = {},
) => {
  if (!firestore) throw new Error('Firestore not initialized')

  const {blocking = true, reason = 'sign-in'} = options
  const syncPromise = createOrUpdateUserInFirestore(firestore, user)

  if (blocking) {
    await syncPromise
    return
  }

  // Email-link auth can resolve before Firestore has an attached auth context.
  void syncPromise.catch((error) => {
    console.warn(`Failed to sync Firebase user after ${reason}:`, error)
  })
}

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')

  const userCredential = await signInWithEmailAndPassword(auth, email, password)

  // Ensure user exists in Firestore (in case they were created before this feature)
  await syncUserProfileAfterSignIn(userCredential.user)

  return userCredential
}

export const signupWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )

  // Create user document in Firestore
  await syncUserProfileAfterSignIn(userCredential.user)

  return userCredential
}

export const loginWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth not initialized')

  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)

  // Create or update user document in Firestore
  await syncUserProfileAfterSignIn(userCredential.user)

  return userCredential
}

export const loginWithGoogleCredential = async (
  credential: OAuthCredential,
) => {
  if (!auth) throw new Error('Firebase auth not initialized')

  const userCredential = await signInWithCredential(auth, credential)

  // Create or update user document in Firestore
  await syncUserProfileAfterSignIn(userCredential.user)

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
  const link =
    emailLink ||
    (typeof window !== 'undefined' ? window.location.href : undefined)
  if (!link) return false
  return isSignInWithEmailLink(auth, link)
}

export const loginWithEmailLink = async (email: string, emailLink?: string) => {
  if (!auth) throw new Error('Firebase auth not initialized')

  // If emailLink is not provided, use the current URL
  const link =
    emailLink ||
    (typeof window !== 'undefined' ? window.location.href : undefined)
  if (!link) {
    throw new Error(
      'Email link is required. Provide emailLink parameter or ensure user is on the page with the email link.',
    )
  }

  const userCredential = await signInWithEmailLink(auth, email, link)

  // Clear email from localStorage after successful sign-in
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('emailForSignIn')
  }

  // Do not block email-link auth on Firestore profile sync.
  await syncUserProfileAfterSignIn(userCredential.user, {
    blocking: false,
    reason: 'email link sign-in',
  })

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
