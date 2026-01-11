'use client'

import {
  deletePinAccessCookie,
  getPinAccessCookie,
  setPinAccessCookie,
} from '@/app/actions/pin-access'
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

const PIN_COOKIE_NAME = 'rf-ac'
const PIN_CODE = 'ZZZZZZ' // 6 character alphanumeric PIN

/**
 * Get PIN from cookie using server action
 */
async function getPinCookie(): Promise<string | undefined> {
  return await getPinAccessCookie()
}

interface PinAccessContextValue {
  isAuthenticated: boolean
  authenticate: (pin: string) => Promise<boolean>
  logout: () => Promise<void>
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

  // Track manual authentication state (for authenticate/logout actions)
  const [authStateVersion, setAuthStateVersion] = useState(0)
  const [storedPin, setStoredPin] = useState<string | undefined>(undefined)

  // Get PIN cookie value using server action
  useEffect(() => {
    getPinCookie().then((pin) => {
      setStoredPin(pin)
    })
  }, [authStateVersion])

  // Derive authentication status from cookie and passes during rendering
  const isAuthenticated = useMemo(() => {
    // Always validate stored PIN against passes
    if (!passes) return false
    if (!storedPin) return false

    return passes.includes(storedPin.toUpperCase())
  }, [passes, storedPin])

  const authenticate = useCallback(
    async (pin: string): Promise<boolean> => {
      const isValid = passes?.includes(pin.toUpperCase()) ?? false

      if (isValid) {
        await setPinAccessCookie(pin.toUpperCase())
        // Force state update to trigger useMemo recalculation
        setAuthStateVersion((prev) => prev + 1)
      }
      return isValid
    },
    [passes],
  )

  const logout = useCallback(async () => {
    await deletePinAccessCookie()
    setAuthStateVersion((prev) => prev + 1)
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

export {PIN_COOKIE_NAME}
