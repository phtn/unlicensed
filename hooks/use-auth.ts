'use client'

import {api} from '@/convex/_generated/api'
import {getCurrentUser, onAuthChange} from '@/lib/firebase/auth'
import {firestore} from '@/lib/firebase/config'
import {createOrUpdateUserInFirestore} from '@/lib/firebase/users'
import {useMutation} from 'convex/react'
import {User} from 'firebase/auth'
import {useEffect, useState} from 'react'

export const useAuth = () => {
  // Lazy initialization: read initial user state
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const [loading, setLoading] = useState(true)
  const createOrUpdateUser = useMutation(api.users.m.createOrUpdateUser)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        // Sync Firebase user with Firestore at /unlicensed/u/u/{uid}
        if (firestore) {
          try {
            await createOrUpdateUserInFirestore(firestore, firebaseUser)
          } catch (error) {
            console.error('Failed to sync user with Firestore:', error)
          }
        }

        // Also sync with Convex (for backward compatibility)
        try {
          await createOrUpdateUser({
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            firebaseId: firebaseUser.uid,
            ...(firebaseUser.photoURL && {photoUrl: firebaseUser.photoURL}),
          })
        } catch (error) {
          console.error('Failed to sync user with Convex:', error)
        }
      }
    })

    return unsubscribe
  }, [createOrUpdateUser])

  useEffect(() => {
    // Rely on onAuthStateChanged for Firestore syncs. During email-link sign-in,
    // auth.currentUser can be populated before Firestore requests have an auth
    // context attached, which makes the eager initial sync fail rules checks.
    const timer = setTimeout(() => {
      setLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  return {user, loading}
}
