import {doc, setDoc, getDoc, type Firestore} from 'firebase/firestore'
import type {User} from 'firebase/auth'

export interface UserData {
  email: string
  name: string
  photoUrl?: string
  createdAt: number
  updatedAt: number
}

/**
 * Creates or updates a user document in Firestore at unlicensed/u/{uid}
 * Path structure: unlicensed collection -> u document -> u subcollection -> {uid} document
 */
export const createOrUpdateUserInFirestore = async (
  firestore: Firestore,
  user: User,
): Promise<void> => {
  if (!firestore) {
    throw new Error('Firestore not initialized')
  }

  // Path: unlicensed/u/{uid}
  // This creates: unlicensed collection -> u document -> u subcollection -> {uid} document
  // Using collection/document/subcollection/document pattern
  const userRef = doc(firestore, 'unlicensed', 'u', 'u', user.uid)
  const userSnap = await getDoc(userRef)

  const userData: UserData = {
    email: user.email || '',
    name: user.displayName || user.email?.split('@')[0] || 'User',
    photoUrl: user.photoURL || undefined,
    updatedAt: Date.now(),
    createdAt: userSnap.exists() ? userSnap.data().createdAt : Date.now(),
  }

  await setDoc(userRef, userData, {merge: true})
}

/**
 * Gets user data from Firestore at unlicensed/u/{uid}
 */
export const getUserFromFirestore = async (
  firestore: Firestore,
  uid: string,
): Promise<UserData | null> => {
  if (!firestore) {
    throw new Error('Firestore not initialized')
  }

  // Path: unlicensed/u/{uid}
  const userRef = doc(firestore, 'unlicensed', 'u', 'u', uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    return null
  }

  return userSnap.data() as UserData
}

