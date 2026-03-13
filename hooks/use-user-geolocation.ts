'use client'

import {
  type DetectedUserLocation,
  isDetectedUserLocation,
} from '@/lib/user-location'
import {startTransition, useCallback, useEffect, useState} from 'react'

type DetectUserCountryOptions = {
  preferPrecise?: boolean
}

type UseUserGeolocationOptions = {
  autoDetect?: boolean
  preferPrecise?: boolean
}

async function fetchDetectedLocation(
  searchParams?: URLSearchParams,
): Promise<DetectedUserLocation> {
  const search = searchParams?.toString()
  const endpoint = search
    ? `/api/detect-country?${search}`
    : '/api/detect-country'
  const response = await fetch(endpoint, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Unable to detect user location.')
  }

  const data = await response.json()
  if (!isDetectedUserLocation(data)) {
    throw new Error('Received an invalid location payload.')
  }

  return data
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000,
    })
  })
}

export async function detectUserCountry(
  options: DetectUserCountryOptions = {},
): Promise<DetectedUserLocation> {
  const preferPrecise = options.preferPrecise ?? true

  if (preferPrecise) {
    try {
      const position = await getCurrentPosition()
      const searchParams = new URLSearchParams({
        latitude: `${position.coords.latitude}`,
        longitude: `${position.coords.longitude}`,
      })

      return await fetchDetectedLocation(searchParams)
    } catch {
      // Fall through to IP/header-based detection.
    }
  }

  return fetchDetectedLocation()
}

export function useUserGeolocation({
  autoDetect = true,
  preferPrecise = false,
}: UseUserGeolocationOptions = {}) {
  const [location, setLocation] = useState<DetectedUserLocation | null>(null)
  const [isLoading, setIsLoading] = useState(autoDetect)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(
    async (options: DetectUserCountryOptions = {}) => {
      startTransition(() => {
        setIsLoading(true)
        setError(null)
      })

      try {
        const detectedLocation = await detectUserCountry({
          preferPrecise,
          ...options,
        })

        startTransition(() => {
          setLocation(detectedLocation)
          setError(null)
        })

        return detectedLocation
      } catch (detectionError) {
        const message =
          detectionError instanceof Error
            ? detectionError.message
            : 'Unable to detect user location.'

        startTransition(() => {
          setError(message)
        })

        return null
      } finally {
        startTransition(() => {
          setIsLoading(false)
        })
      }
    },
    [preferPrecise],
  )

  useEffect(() => {
    if (!autoDetect) {
      startTransition(() => {
        setIsLoading(false)
      })
      return
    }

    void refresh({preferPrecise})
  }, [autoDetect, preferPrecise, refresh])

  return {
    location,
    isLoading,
    error,
    refresh,
    requestPreciseLocation: () => refresh({preferPrecise: true}),
  }
}
