'use client'

import {api} from '@/convex/_generated/api'
import {getCurrentUser, onAuthChange} from '@/lib/firebase/auth'
import {firestore} from '@/lib/firebase/config'
import {createOrUpdateUserInFirestore} from '@/lib/firebase/users'
import {useMutation} from 'convex/react'
import {User} from 'firebase/auth'
import {useEffect, useRef, useState} from 'react'

export const useAuth = () => {
  // Lazy initialization: read initial user state
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const [loading, setLoading] = useState(true)
  const createOrUpdateUser = useMutation(api.users.m.createOrUpdateUser)
  const hasInitializedRef = useRef(false)

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
    // Ensure user exists in Firestore on initial load if user is already set
    if (!hasInitializedRef.current && user && firestore) {
      hasInitializedRef.current = true
      createOrUpdateUserInFirestore(firestore, user).catch((error) => {
        console.error(
          'Failed to sync user with Firestore on initial load:',
          error,
        )
      })
    }
    // onAuthStateChanged will fire immediately, so we can set loading to false
    // after a brief delay to allow the subscription to initialize
    const timer = setTimeout(() => {
      setLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [user])

  return {user, loading}
}
