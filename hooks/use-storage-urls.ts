'use client'

import {api} from '@/convex/_generated/api'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import type {FunctionReturnType} from 'convex/server'
import {useMemo} from 'react'

const isDirectAssetUrl = (value: string) =>
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('/') ||
  value.startsWith('data:') ||
  value.startsWith('blob:')

/**
 * Resolves legacy Convex storage IDs while passing through direct asset URLs.
 *
 * R2/public URLs do not need any Convex round-trip, so this hook only queries
 * for unresolved legacy `_storage` IDs.
 *
 * @param values - Array of storage references or direct URLs
 * @returns A function that resolves a storage reference to a URL string, or null if not found
 *
 * @example
 * ```tsx
 * const resolveUrl = useStorageUrls(['storageId123', 'https://cdn.example.com/file.webp'])
 * const url = resolveUrl('storageId123') // Returns resolved URL or null
 * const r2Url = resolveUrl('https://cdn.example.com/file.webp') // Returns the same URL
 * ```
 */
export const useStorageUrls = (
  values: (string | undefined | null)[],
): ((value: string) => string | null) => {
  type StorageUrlsResult = FunctionReturnType<typeof api.uploads.getStorageUrls>

  // Normalize refs once so callers can pass a mix of legacy storage IDs and direct URLs.
  const storageRefs = useMemo(() => {
    return Array.from(
      new Set(
        values.filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0,
        ),
      ),
    )
  }, [values])

  const storageIdsToResolve = useMemo(() => {
    return storageRefs.filter((value) => !isDirectAssetUrl(value))
  }, [storageRefs])

  // Fetch URLs only for legacy storage IDs.
  const {data: storageUrls} = useConvexSnapshotQuery(
    api.uploads.getStorageUrls,
    storageIdsToResolve.length > 0 ? {storageIds: storageIdsToResolve} : 'skip',
  ) as {data: StorageUrlsResult | undefined}

  // Create a map of legacy storageId -> URL for quick lookup.
  const urlMap = useMemo(() => {
    if (!storageUrls) {
      return new Map<string, string | null>()
    }
    return new Map(
      storageUrls.map(({storageId, url}) => [storageId, url] as const),
    )
  }, [storageUrls])

  // Return a resolver function that passes through direct URLs unchanged.
  return useMemo(() => {
    return (value: string): string | null => {
      if (!value) return null
      if (isDirectAssetUrl(value)) return value
      return urlMap.get(value) ?? null
    }
  }, [urlMap])
}
