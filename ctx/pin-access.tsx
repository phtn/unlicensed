'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const PIN_STORAGE_KEY = 'pin-access-authenticated'
const PIN_CODE = 'ZZZZZZ' // 6 character alphanumeric PIN

interface PinAccessContextValue {
  isAuthenticated: boolean
  authenticate: (pin: string) => boolean
  logout: () => void
  pinLength: number
}

const PinAccessCtx = createContext<PinAccessContextValue | null>(null)

interface PinAccessProviderProps {
  children: ReactNode
}

export function PinAccessProvider({children}: PinAccessProviderProps) {
  const haltPass = useQuery(api.admin.q.getHaltPass)
  const passes = useMemo(
    () => haltPass?.value?.value.map((pass: string) => pass.toUpperCase()),
    [haltPass],
  )

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Re-check authentication when passes become available from the query
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!passes) return

    const stored = localStorage.getItem(PIN_STORAGE_KEY)
    if (stored && passes.includes(stored.toUpperCase())) {
      setIsAuthenticated(true)
    }
  }, [passes])

  const authenticate = useCallback(
    (pin: string): boolean => {
      const isValid = passes?.includes(pin.toUpperCase()) ?? false

      if (isValid) {
        localStorage.setItem(PIN_STORAGE_KEY, pin.toUpperCase())
        setIsAuthenticated(true)
      }
      return isValid
    },
    [passes],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(PIN_STORAGE_KEY)
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      authenticate,
      logout,
      pinLength: PIN_CODE.length,
    }),
    [isAuthenticated, authenticate, logout],
  )

  return <PinAccessCtx.Provider value={value}>{children}</PinAccessCtx.Provider>
}

export function usePinAccess(): PinAccessContextValue {
  const ctx = useContext(PinAccessCtx)
  if (!ctx) {
    throw new Error('usePinAccess must be used within a PinAccessProvider')
  }
  return ctx
}

export {PIN_STORAGE_KEY}
