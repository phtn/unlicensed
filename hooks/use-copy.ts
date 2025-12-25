import {useCallback, useState} from 'react'

interface UseCopyOptions {
  timeout?: number
}

interface UseCopyReturn {
  copy: (label: string, text: string) => void
  copied: boolean
}

export function useCopy({timeout = 2000}: UseCopyOptions = {}): UseCopyReturn {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (label: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), timeout)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    },
    [timeout],
  )

  return {copy, copied}
}

