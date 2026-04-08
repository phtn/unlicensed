'use client'

import {useMutation} from 'convex/react'
import {useCallback, useState} from 'react'
import type {FunctionReference, OptionalRestArgs} from 'convex/server'
import {getAppError, toDisplayMessage, type AppErrorData} from '@/lib/errors'

interface MutationState {
  isLoading: boolean
  error: AppErrorData | null
  errorMessage: string | null
}

/**
 * Drop-in replacement for `useMutation` that exposes structured error state.
 *
 * - `error`        → AppErrorData if a ConvexError<AppErrorData> was thrown, else null
 * - `errorMessage` → display-safe message (works in dev & prod)
 * - `clearError`   → reset error state before a retry
 *
 * @example
 * const {mutate: placeOrder, isLoading, errorMessage} = useMutationError(api.orders.m.place)
 * <button onClick={() => placeOrder({...})} disabled={isLoading}>
 * {errorMessage && <p className="text-red-500">{errorMessage}</p>}
 */
export function useMutationError<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
) {
  const convexMutate = useMutation(mutation)
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
    errorMessage: null,
  })

  const mutate = useCallback(
    async (...args: OptionalRestArgs<Mutation>) => {
      setState({isLoading: true, error: null, errorMessage: null})
      try {
        const result = await convexMutate(...args)
        setState({isLoading: false, error: null, errorMessage: null})
        return result
      } catch (err) {
        const error = getAppError(err)
        const errorMessage = toDisplayMessage(err)
        setState({isLoading: false, error, errorMessage})
        // Re-throw so callers can still catch if needed
        throw err
      }
    },
    [convexMutate],
  )

  const clearError = useCallback(() => {
    setState((prev) => ({...prev, error: null, errorMessage: null}))
  }, [])

  return {
    mutate,
    isLoading: state.isLoading,
    error: state.error,
    errorMessage: state.errorMessage,
    clearError,
  }
}
