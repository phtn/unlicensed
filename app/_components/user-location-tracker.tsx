'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useGuestChatCtx} from '@/ctx/guest-chat'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import {useUserGeolocation} from '@/hooks/use-user-geolocation'
import {setUserLocationCookies} from '@/lib/user-location'
import {useMutation} from 'convex/react'
import {useEffect, useRef} from 'react'

export function UserLocationTracker() {
  const {user} = useAuthCtx()
  const {guestFid} = useGuestChatCtx()
  const {location} = useUserGeolocation({
    autoDetect: true,
    preferPrecise: false,
  })
  const updateUserLocation = useMutation(api.users.m.updateLocation)
  const updateGuestLocation = useMutation(api.guests.m.updateLocation)
  const activeFid = user?.uid ?? guestFid ?? null
  const {data: activeUser} = useConvexSnapshotQuery(
    api.messages.q.getParticipantByFid,
    activeFid ? {fid: activeFid} : 'skip',
  )
  const lastSyncedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setUserLocationCookies(location)
  }, [location])

  useEffect(() => {
    if (!location || !activeFid || !activeUser?._id) {
      return
    }

    const nextSyncKey = JSON.stringify([
      activeFid,
      location.country,
      location.countryCode,
      location.city,
      location.latitude,
      location.longitude,
      location.source,
    ])

    if (lastSyncedKeyRef.current === nextSyncKey) {
      return
    }

    const syncLocation = user?.uid ? updateUserLocation : updateGuestLocation

    void syncLocation({
      fid: activeFid,
      ...(location.country ? {country: location.country} : {}),
      ...(location.countryCode ? {countryCode: location.countryCode} : {}),
      ...(location.city ? {city: location.city} : {}),
      ...(location.latitude !== null ? {latitude: location.latitude} : {}),
      ...(location.longitude !== null ? {longitude: location.longitude} : {}),
      source: location.source,
    })
      .then(() => {
        lastSyncedKeyRef.current = nextSyncKey
      })
      .catch((error) => {
        console.error('Failed to sync user location:', error)
      })
  }, [
    activeFid,
    activeUser?._id,
    location,
    updateGuestLocation,
    updateUserLocation,
    user?.uid,
  ])

  return null
}
