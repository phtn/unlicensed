'use client'

import {ensureGuestChatId} from '@/app/actions'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {
  clearGuestChatIdCookie,
  createGuestChatId,
  getGuestChatIdCookie,
  setGuestChatIdCookie,
} from '@/lib/guest-chat'
import {useMutation} from 'convex/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type GuestRepresentative = {
  name: string
  email: string
  photoUrl: string | null
}

type GuestSessionResult = {
  guestId: string
  guestFid: string
  representativeFid: string
  representative: GuestRepresentative
}

type GuestChatCtxValue = {
  guestId: string | null
  guestFid: string | null
  representativeFid: string | null
  representative: GuestRepresentative | null
  activeChatFid: string | null
  isBootstrapping: boolean
  isMerging: boolean
  error: string | null
  ensureSession: () => Promise<GuestSessionResult | null>
  clearSession: () => void
}

const GuestChatCtx = createContext<GuestChatCtxValue | null>(null)

export function GuestChatProvider({children}: {children: ReactNode}) {
  const {user, convexUserId, isConvexUserLoading} = useAuthCtx()
  const [guestId, setGuestId] = useState<string | null>(null)
  const [guestFid, setGuestFid] = useState<string | null>(null)
  const [representativeFid, setRepresentativeFid] = useState<string | null>(
    null,
  )
  const [representative, setRepresentative] =
    useState<GuestRepresentative | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ensureGuestConversation = useMutation(
    api.messages.m.ensureGuestConversation,
  )
  const mergeGuestConversation = useMutation(
    api.messages.m.mergeGuestConversation,
  )

  const bootstrappedGuestIdRef = useRef<string | null>(null)
  const mergeAttemptGuestIdRef = useRef<string | null>(null)
  const guestIdPromiseRef = useRef<Promise<string> | null>(null)
  const bootstrapPromiseRef = useRef<Promise<GuestSessionResult | null> | null>(
    null,
  )

  const clearSession = useCallback(() => {
    clearGuestChatIdCookie()
    setGuestId(null)
    setGuestFid(null)
    setRepresentativeFid(null)
    setRepresentative(null)
    setError(null)
    setIsBootstrapping(false)
    bootstrappedGuestIdRef.current = null
    mergeAttemptGuestIdRef.current = null
    bootstrapPromiseRef.current = null
  }, [])

  useEffect(() => {
    const cookieGuestId = getGuestChatIdCookie()
    if (cookieGuestId) {
      setGuestId(cookieGuestId)
    }
  }, [])

  const ensureGuestIdentifier = useCallback(async () => {
    if (guestIdPromiseRef.current) {
      return guestIdPromiseRef.current
    }

    const nextGuestIdPromise = (async () => {
      const existingGuestId = guestId ?? getGuestChatIdCookie()

      try {
        const persistedGuestId = await ensureGuestChatId(existingGuestId)
        setGuestChatIdCookie(persistedGuestId)
        if (guestId !== persistedGuestId) {
          setGuestId(persistedGuestId)
        }
        return persistedGuestId
      } catch (persistError) {
        console.error(
          'Failed to persist guest chat identifier via server action:',
          persistError,
        )

        const fallbackGuestId = existingGuestId ?? createGuestChatId()
        setGuestChatIdCookie(fallbackGuestId)
        if (guestId !== fallbackGuestId) {
          setGuestId(fallbackGuestId)
        }
        return fallbackGuestId
      } finally {
        guestIdPromiseRef.current = null
      }
    })()

    guestIdPromiseRef.current = nextGuestIdPromise
    return nextGuestIdPromise
  }, [guestId])

  useEffect(() => {
    if (user?.uid) {
      return
    }

    if (guestId && getGuestChatIdCookie()) {
      return
    }

    void ensureGuestIdentifier()
  }, [ensureGuestIdentifier, guestId, user?.uid])

  useEffect(() => {
    if (user?.uid) {
      return
    }

    mergeAttemptGuestIdRef.current = null
    setIsMerging(false)
  }, [user?.uid])

  const ensureSession = useCallback(async () => {
    if (user?.uid && !isMerging) {
      return null
    }

    const nextGuestId = await ensureGuestIdentifier()

    if (
      bootstrappedGuestIdRef.current === nextGuestId &&
      guestFid &&
      representativeFid &&
      representative
    ) {
      return {
        guestId: nextGuestId,
        guestFid,
        representativeFid,
        representative,
      }
    }

    if (bootstrapPromiseRef.current) {
      return bootstrapPromiseRef.current
    }

    const bootstrapPromise = (async () => {
      setIsBootstrapping(true)
      setError(null)

      try {
        const result = await ensureGuestConversation({guestId: nextGuestId})

        setGuestId(result.guestId)
        setGuestFid(result.guestFid)
        setRepresentativeFid(result.representativeFid)
        setRepresentative(result.representative)
        bootstrappedGuestIdRef.current = nextGuestId

        return result
      } catch (bootstrapError) {
        setError(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : 'Unable to start guest chat right now.',
        )
        return null
      } finally {
        setIsBootstrapping(false)
        bootstrapPromiseRef.current = null
      }
    })()

    bootstrapPromiseRef.current = bootstrapPromise
    return bootstrapPromise
  }, [
    ensureGuestIdentifier,
    ensureGuestConversation,
    guestFid,
    isMerging,
    representative,
    representativeFid,
    user?.uid,
  ])

  useEffect(() => {
    if (user?.uid) {
      return
    }

    if (guestFid && representativeFid && representative) {
      return
    }

    // Create the guest chat participant and representative link on visit
    // so staff can see the guest before they manually open the chat UI.
    void ensureSession()
  }, [ensureSession, guestFid, representative, representativeFid, user?.uid])

  useEffect(() => {
    if (!user?.uid || isConvexUserLoading || !convexUserId) {
      return
    }

    const pendingGuestId = guestId ?? getGuestChatIdCookie()
    if (!pendingGuestId) {
      return
    }

    if (mergeAttemptGuestIdRef.current === pendingGuestId) {
      return
    }

    mergeAttemptGuestIdRef.current = pendingGuestId
    setIsMerging(true)

    mergeGuestConversation({
      guestId: pendingGuestId,
      userFid: user.uid,
    })
      .then(() => {
        clearSession()
      })
      .catch((mergeError) => {
        mergeAttemptGuestIdRef.current = null
        setError(
          mergeError instanceof Error
            ? mergeError.message
            : 'Unable to carry over guest chat yet.',
        )
      })
      .finally(() => {
        setIsMerging(false)
      })
  }, [
    clearSession,
    convexUserId,
    guestId,
    isConvexUserLoading,
    mergeGuestConversation,
    user?.uid,
  ])

  const value = useMemo<GuestChatCtxValue>(
    () => ({
      guestId,
      guestFid,
      representativeFid,
      representative,
      activeChatFid: user?.uid
        ? isMerging
          ? (guestFid ?? user.uid)
          : user.uid
        : guestFid,
      isBootstrapping,
      isMerging,
      error,
      ensureSession,
      clearSession,
    }),
    [
      clearSession,
      ensureSession,
      error,
      guestFid,
      guestId,
      isBootstrapping,
      isMerging,
      representative,
      representativeFid,
      user?.uid,
    ],
  )

  return <GuestChatCtx value={value}>{children}</GuestChatCtx>
}

export function useGuestChatCtx() {
  const ctx = useContext(GuestChatCtx)

  if (!ctx) {
    throw new Error('GuestChatProvider is missing')
  }

  return ctx
}
