'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useGuestChatCtx} from '@/ctx/guest-chat'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef} from 'react'

const ACTIVITY_SYNC_INTERVAL_MS = 60_000
const ACTIVITY_RETRY_AFTER_FAILURE_MS = 5 * 60_000

export function UserActivityTracker() {
  const {user} = useAuthCtx()
  const {guestFid} = useGuestChatCtx()
  const updateUserActivity = useMutation(api.users.m.updateActivity)
  const updateGuestActivity = useMutation(api.guests.m.updateActivity)
  const lastSyncedAtRef = useRef(0)
  const lastFailedAtRef = useRef(0)
  const activeFid = user?.uid ?? guestFid ?? null
  const isSignedInUser = Boolean(user?.uid)

  const syncActivity = useCallback(() => {
    if (!activeFid || document.visibilityState === 'hidden') return
    if (navigator.onLine === false) return

    const now = Date.now()
    if (now - lastSyncedAtRef.current < ACTIVITY_SYNC_INTERVAL_MS) return
    if (now - lastFailedAtRef.current < ACTIVITY_RETRY_AFTER_FAILURE_MS) return

    lastSyncedAtRef.current = now
    const mutation = isSignedInUser ? updateUserActivity : updateGuestActivity

    void mutation({fid: activeFid}).then(() => {
      lastFailedAtRef.current = 0
    }).catch(() => {
      lastFailedAtRef.current = Date.now()
    })
  }, [activeFid, isSignedInUser, updateGuestActivity, updateUserActivity])

  useEffect(() => {
    lastSyncedAtRef.current = 0
    syncActivity()
  }, [activeFid, syncActivity])

  useEffect(() => {
    if (!activeFid) return

    const intervalId = window.setInterval(
      syncActivity,
      ACTIVITY_SYNC_INTERVAL_MS,
    )
    const handleVisibleActivity = () => syncActivity()

    window.addEventListener('focus', handleVisibleActivity)
    window.addEventListener('online', handleVisibleActivity)
    document.addEventListener('visibilitychange', handleVisibleActivity)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleVisibleActivity)
      window.removeEventListener('online', handleVisibleActivity)
      document.removeEventListener('visibilitychange', handleVisibleActivity)
    }
  }, [activeFid, syncActivity])

  return null
}
