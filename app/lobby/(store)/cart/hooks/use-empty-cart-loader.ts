import {useEffect, useRef, useState} from 'react'

interface UseEmptyCartLoaderParams {
  isLoading: boolean
  hasItems: boolean
  loaderDurationMs?: number
}

export function useEmptyCartLoader({
  isLoading,
  hasItems,
  loaderDurationMs = 3000,
}: UseEmptyCartLoaderParams) {
  const [showEmptyCartLoader, setShowEmptyCartLoader] = useState(false)
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current)
      loaderTimerRef.current = null
    }

    if (isLoading || hasItems) {
      const timeoutId = setTimeout(() => {
        setShowEmptyCartLoader(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    const showTimeoutId = setTimeout(() => {
      setShowEmptyCartLoader(true)
    }, 0)

    loaderTimerRef.current = setTimeout(() => {
      setShowEmptyCartLoader(false)
      loaderTimerRef.current = null
    }, loaderDurationMs)

    return () => {
      clearTimeout(showTimeoutId)
      if (loaderTimerRef.current) {
        clearTimeout(loaderTimerRef.current)
        loaderTimerRef.current = null
      }
    }
  }, [isLoading, hasItems, loaderDurationMs])

  return showEmptyCartLoader
}
