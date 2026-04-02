'use client'

import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {auth, firestore} from '@/lib/firebase/config'
import {createOrUpdateUserInFirestore} from '@/lib/firebase/users'
import {useMutation, useQuery} from 'convex/react'
import {User} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export interface CompleteEmailLinkState {
  href: string
}

interface AuthCtxValues {
  user: User | null
  loading: boolean
  convexUser: Doc<'users'> | null
  convexUserId: Id<'users'> | null
  isConvexUserLoading: boolean
  isAuthModalOpen: boolean
  setAuthModalOpen: (isOpen: boolean) => void
  closeAuthModal: () => void
  completeEmailLink: CompleteEmailLinkState | null
  setCompleteEmailLink: (state: CompleteEmailLinkState | null) => void
}

const AuthCtx = createContext<AuthCtxValues | null>(null)

const AuthCtxProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => auth?.currentUser ?? null)
  const [loading, setLoading] = useState(() => Boolean(auth))
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [completeEmailLink, setCompleteEmailLink] =
    useState<CompleteEmailLinkState | null>(null)
  const createOrUpdateUser = useMutation(api.users.m.createOrUpdateUser)
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const convexUserId = convexUser?._id ?? null
  const isConvexUserLoading = Boolean(user?.uid && convexUser === undefined)

  useEffect(() => {
    if (!user) {
      return
    }

    if (!firestore) {
      return
    }

    let cancelled = false

    void createOrUpdateUserInFirestore(firestore, user).catch((error) => {
      if (!cancelled) {
        console.error('Failed to sync user with Firestore:', error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user?.uid || !user.email || convexUser === undefined) {
      return
    }

    const nextName = user.displayName || user.email.split('@')[0]
    const nextPhotoUrl = user.photoURL ?? null
    const needsSync =
      !convexUser ||
      convexUser.fid !== user.uid ||
      convexUser.email !== user.email ||
      convexUser.name !== nextName ||
      (convexUser.photoUrl ?? null) !== nextPhotoUrl

    if (!needsSync) {
      return
    }

    void createOrUpdateUser({
      email: user.email,
      name: nextName,
      firebaseId: user.uid,
      ...(user.photoURL ? {photoUrl: user.photoURL} : {}),
    }).catch((error) => {
      console.error('Failed to sync user with Convex:', error)
    })
  }, [convexUser, createOrUpdateUser, user])

  useEffect(() => {
    if (!auth) {
      return
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
      if (user) {
        // Perform additional actions when user is authenticated
        // onSuccess(`Welcome back, ${user.displayName?.split(' ')[0]}!`)
      }
    })
    return () => unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      convexUser: convexUser ?? null,
      convexUserId,
      isConvexUserLoading,
      isAuthModalOpen,
      setAuthModalOpen: setIsAuthModalOpen,
      closeAuthModal: () => {
        setIsAuthModalOpen(false)
        setCompleteEmailLink(null)
      },
      completeEmailLink,
      setCompleteEmailLink,
    }),
    [
      user,
      loading,
      convexUser,
      convexUserId,
      isConvexUserLoading,
      isAuthModalOpen,
      completeEmailLink,
    ],
  )
  return <AuthCtx value={value}>{children}</AuthCtx>
}

const useAuthCtx = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('AuthCtxProvider is missing')
  return ctx
}

export {AuthCtx, AuthCtxProvider, useAuthCtx}
