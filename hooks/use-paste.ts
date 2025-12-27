import {useCallback, useEffect, useRef, useState} from 'react'

interface UsePasteOptions {
  timeout?: number
}

interface UsePasteReturn {
  paste: () => Promise<string | null>
  pastedText: string | null
  isPasting: boolean
  pasted: boolean
  error: Error | null
}

export function usePaste({timeout = 2000}: UsePasteOptions = {}): UsePasteReturn {
  const [pastedText, setPastedText] = useState<string | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pasted, setPasted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const paste = useCallback(async (): Promise<string | null> => {
    setIsPasting(true)
    setError(null)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    try {
      const text = await navigator.clipboard.readText()
      setPastedText(text)
      setPasted(true)

      // Set timeout to reset pasted state
      timeoutRef.current = setTimeout(() => {
        setPasted(false)
        timeoutRef.current = null
      }, timeout)

      return text
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to read from clipboard')
      setError(error)
      console.error('Failed to paste:', error)
      return null
    } finally {
      setIsPasting(false)
    }
  }, [timeout])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {paste, pastedText, isPasting, pasted, error}
}
