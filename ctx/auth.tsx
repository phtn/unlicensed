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

interface AuthCtxValues {
  user: User | null
  isAuthModalOpen: boolean
  setAuthModalOpen: (isOpen: boolean) => void
  closeAuthModal: () => void
}

const AuthCtx = createContext<AuthCtxValues | null>(null)

const AuthCtxProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      setUser(user)
    })
    return () => unsubscribe?.()
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthModalOpen,
      setAuthModalOpen: setIsAuthModalOpen,
      closeAuthModal: () => setIsAuthModalOpen(false),
    }),
    [user, isAuthModalOpen],
  )
  return <AuthCtx value={value}>{children}</AuthCtx>
}

const useAuthCtx = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('AuthCtxProvider is missing')
  return ctx
}

export {AuthCtx, AuthCtxProvider, useAuthCtx}
