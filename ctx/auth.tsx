'use client'

import {auth} from '@/lib/firebase/config'
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
  isAuthModalOpen: boolean
  setAuthModalOpen: (isOpen: boolean) => void
  closeAuthModal: () => void
  completeEmailLink: CompleteEmailLinkState | null
  setCompleteEmailLink: (state: CompleteEmailLinkState | null) => void
}

const AuthCtx = createContext<AuthCtxValues | null>(null)

const AuthCtxProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [completeEmailLink, setCompleteEmailLink] =
    useState<CompleteEmailLinkState | null>(null)

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        // Perform additional actions when user is authenticated
        // onSuccess(`Welcome back, ${user.displayName?.split(' ')[0]}!`)
      }
    })
    return () => unsubscribe?.()
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthModalOpen,
      setAuthModalOpen: setIsAuthModalOpen,
      closeAuthModal: () => {
        setIsAuthModalOpen(false)
        setCompleteEmailLink(null)
      },
      completeEmailLink,
      setCompleteEmailLink,
    }),
    [user, isAuthModalOpen, completeEmailLink],
  )
  return <AuthCtx value={value}>{children}</AuthCtx>
}

const useAuthCtx = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('AuthCtxProvider is missing')
  return ctx
}

export {AuthCtx, AuthCtxProvider, useAuthCtx}
