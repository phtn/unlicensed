import {useEffect, useState} from 'react'

interface RemoteMDXState {
  content: string | null
  loading: boolean
  error: string | null
}

export function useRemoteMDX(url: string | undefined) {
  const [state, setState] = useState<RemoteMDXState>({
    content: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!url) {
      setState({content: null, loading: false, error: null})
      return
    }

    let cancelled = false

    const fetchRemoteMDX = async () => {
      setState({content: null, loading: true, error: null})

      try {
        const response = await fetch('/api/mdx/remote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({url}),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: 'Failed to fetch remote MDX',
          }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!cancelled) {
          setState({
            content: data.content,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            content: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load remote MDX',
          })
        }
      }
    }

    fetchRemoteMDX()

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
