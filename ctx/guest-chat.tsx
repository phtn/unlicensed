'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {
  clearGuestChatIdCookie,
  createGuestChatId,
  getGuestChatIdCookie,
  setGuestChatIdCookie,
} from '@/lib/guest-chat'
import {useMutation, useQuery} from 'convex/react'
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
  const {user} = useAuthCtx()
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
  const createOrUpdateUser = useMutation(api.users.m.createOrUpdateUser)
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  const bootstrappedGuestIdRef = useRef<string | null>(null)
  const mergeAttemptGuestIdRef = useRef<string | null>(null)
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

  useEffect(() => {
    if (user?.uid) {
      return
    }

    mergeAttemptGuestIdRef.current = null
    setIsMerging(false)
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || !user.email || convexUser?._id) {
      return
    }

    void createOrUpdateUser({
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      firebaseId: user.uid,
      ...(user.photoURL ? {photoUrl: user.photoURL} : {}),
    }).catch((syncError) => {
      console.error('Failed to sync authenticated user for guest chat:', syncError)
    })
  }, [
    convexUser?._id,
    createOrUpdateUser,
    user?.displayName,
    user?.email,
    user?.photoURL,
    user?.uid,
  ])

  const ensureSession = useCallback(async () => {
    if (user?.uid && !isMerging) {
      return null
    }

    const existingGuestId = guestId ?? getGuestChatIdCookie()
    const nextGuestId = existingGuestId || createGuestChatId()

    if (!existingGuestId) {
      setGuestChatIdCookie(nextGuestId)
    }

    if (guestId !== nextGuestId) {
      setGuestId(nextGuestId)
    }

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
    ensureGuestConversation,
    guestId,
    guestFid,
    isMerging,
    representative,
    representativeFid,
    user?.uid,
  ])

  useEffect(() => {
    if (!user?.uid || !convexUser?._id) {
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
    convexUser?._id,
    guestId,
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
          ? guestFid ?? user.uid
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
