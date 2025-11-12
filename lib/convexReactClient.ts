'use client'

import {ConvexReactClient} from 'convex/react'
import {getConvexUrl} from '@/lib/convexClient'

let cachedReactClient: ConvexReactClient | null = null

export const getConvexReactClient = (): ConvexReactClient => {
  if (cachedReactClient) {
    return cachedReactClient
  }

  const url = getConvexUrl()
  if (!url) {
    throw new Error(
      'Convex URL is not configured. Please set NEXT_PUBLIC_CONVEX_URL.',
    )
  }

  cachedReactClient = new ConvexReactClient(url)
  return cachedReactClient
}

