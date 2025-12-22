import type {ApiResponse} from '@/lib/paygate/types'
import {useCallback, useRef, useState} from 'react'

export function useApiCall() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleApiCall = useCallback(async (url: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    setResponse(null)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/html, */*',
        },
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      const contentType = response.headers.get('content-type') || ''
      let data: unknown

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else if (contentType.includes('text/html')) {
        const html = await response.text()
        data = {
          type: 'html',
          content: html,
          message:
            'This endpoint returns an HTML checkout page. Open the URL in a new tab to view it.',
        }
      } else {
        data = await response.text()
      }

      if (!abortController.signal.aborted) {
        setResponse({
          success: response.ok,
          data,
          url,
        })
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== 'AbortError' &&
        !abortController.signal.aborted
      ) {
        setResponse({
          success: false,
          error: error.message,
          url,
        })
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  return {loading, response, handleApiCall}
}
