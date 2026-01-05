import {auth} from '@/lib/firebase/config'
import type {User} from 'firebase/auth'
import {useSyncExternalStore} from 'react'

type AuthSnapshot = {
  user: User | null
  isLoading: boolean
}

let currentUser: User | null = auth?.currentUser ?? null
let hasResolvedAuthState = false
let cachedSnapshot: AuthSnapshot = {user: null, isLoading: true}
const serverSnapshot: AuthSnapshot = {user: null, isLoading: true}

function subscribe(onStoreChange: () => void): () => void {
  if (!auth) {
    hasResolvedAuthState = true
    currentUser = null
    cachedSnapshot = {user: null, isLoading: false}
    return () => {}
  }

  const unsubscribe = auth.onAuthStateChanged((user) => {
    currentUser = user
    hasResolvedAuthState = true
    const nextSnapshot: AuthSnapshot = {user: currentUser, isLoading: false}
    if (
      cachedSnapshot.user !== nextSnapshot.user ||
      cachedSnapshot.isLoading !== nextSnapshot.isLoading
    ) {
      cachedSnapshot = nextSnapshot
    }
    onStoreChange()
  })

  return () => unsubscribe()
}

function getSnapshot(): AuthSnapshot {
  if (!hasResolvedAuthState) {
    return cachedSnapshot
  }

  if (cachedSnapshot.user === currentUser && cachedSnapshot.isLoading === false) {
    return cachedSnapshot
  }

  cachedSnapshot = {user: currentUser, isLoading: false}
  return cachedSnapshot
}

function getServerSnapshot(): AuthSnapshot {
  return serverSnapshot
}

export function useFirebaseAuthUser(): AuthSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

