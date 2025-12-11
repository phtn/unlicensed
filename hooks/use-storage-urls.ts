'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

/**
 * Custom hook to resolve storageIds to URLs.
 * Handles both URLs (already resolved) and storageIds (needs resolution).
 *
 * @param values - Array of strings that could be URLs or storageIds
 * @returns A function that resolves any value (URL or storageId) to a URL string
 *
 * @example
 * ```tsx
 * const resolveUrl = useStorageUrls(['http://example.com/image.jpg', 'storageId123'])
 * const url1 = resolveUrl('http://example.com/image.jpg') // Returns as-is
 * const url2 = resolveUrl('storageId123') // Returns resolved URL or empty string
 * ```
 */
export const useStorageUrls = (
  values: (string | undefined | null)[],
): ((value: string) => string) => {
  // Extract storageIds that need URL resolution (not already URLs)
  const storageIdsToResolve = useMemo(() => {
    return values
      .filter((value): value is string => !!value && !value.startsWith('http'))
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
    return (value: string): string => {
      if (!value) return ''
      if (value.startsWith('http')) {
        return value
      }
      return (urlMap.get(value) as string) ?? null
    }
  }, [urlMap])
}
