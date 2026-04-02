'use client'

import {useConvex} from 'convex/react'
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server'
import {getFunctionName} from 'convex/server'
import {useCallback, useEffect, useRef, useState} from 'react'

type SnapshotQueryOptions<Query extends FunctionReference<'query'>> = {
  initialData?: FunctionReturnType<Query>
  refetchOnMount?: boolean
}

export const useConvexSnapshotQuery = <
  Query extends FunctionReference<'query'>,
>(
  query: Query,
  args: FunctionArgs<Query> | 'skip',
  options?: SnapshotQueryOptions<Query>,
) => {
  const convex = useConvex()
  const queryName = getFunctionName(query)
  const argsKey = args === 'skip' ? 'skip' : JSON.stringify(args)
  const requestKey = `${queryName}:${argsKey}`
  const initialRequestKeyRef = useRef(requestKey)
  const queryRef = useRef(query)
  const argsRef = useRef(args)
  const requestIdRef = useRef(0)

  queryRef.current = query
  argsRef.current = args

  // Convex API references are proxy objects, so the function name is the stable key.
  const canUseInitialData =
    options?.initialData !== undefined &&
    requestKey === initialRequestKeyRef.current

  const [data, setData] = useState<FunctionReturnType<Query> | undefined>(
    canUseInitialData ? options?.initialData : undefined,
  )
  const [isLoading, setIsLoading] = useState(
    argsKey !== 'skip' && !canUseInitialData,
  )
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    const nextArgs = argsRef.current
    if (nextArgs === 'skip') {
      requestIdRef.current += 1
      setData(undefined)
      setError(null)
      setIsLoading(false)
      return undefined
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const result = await convex.query(queryRef.current, nextArgs)
      if (requestId === requestIdRef.current) {
        setData(result)
      }
      return result
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error('Failed to run Convex snapshot query.')

      if (requestId === requestIdRef.current) {
        setError(normalizedError)
      }

      return undefined
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [convex])

  useEffect(() => {
    if (argsKey === 'skip') {
      requestIdRef.current += 1
      setData(undefined)
      setError(null)
      setIsLoading(false)
      return
    }

    const shouldFetch = options?.refetchOnMount ?? !canUseInitialData
    if (!shouldFetch) {
      setIsLoading(false)
      return
    }

    setData(undefined)
    void refresh()
  }, [argsKey, requestKey, canUseInitialData, options?.refetchOnMount, refresh])

  return {
    data,
    error,
    isLoading,
    refresh,
  }
}
