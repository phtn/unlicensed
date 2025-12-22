'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

/**
 * Custom hook to resolve storageIds to URLs.
 *
 * @param values - Array of storageIds (strings)
 * @returns A function that resolves a storageId to a URL string, or null if not found
 *
 * @example
 * ```tsx
 * const resolveUrl = useStorageUrls(['storageId123', 'storageId456'])
 * const url = resolveUrl('storageId123') // Returns resolved URL or null
 * ```
 */
export const useStorageUrls = (
  values: (string | undefined | null)[],
): ((value: string) => string | null) => {
  // Extract unique storageIds (filter out null/undefined and duplicates)
  const storageIdsToResolve = useMemo(() => {
    return values
      .filter((value): value is string => !!value)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
  }, [values])

  // Fetch URLs for all storageIds
  const storageUrls = useQuery(
    api.uploads.getStorageUrls,
    storageIdsToResolve.length > 0 ? {storageIds: storageIdsToResolve} : 'skip',
  )

  // Create a map of storageId -> URL for quick lookup
  const urlMap = useMemo(() => {
    if (!storageUrls || storageIdsToResolve.length === 0) {
      return new Map<string, string | null>()
    }
    return new Map(storageUrls.map(({storageId, url}) => [storageId, url]))
  }, [storageUrls, storageIdsToResolve.length])

  // Return a resolver function
  return useMemo(() => {
    return (value: string): string | null => {
      if (!value) return null
      return urlMap.get(value) ?? null
    }
  }, [urlMap])
}
