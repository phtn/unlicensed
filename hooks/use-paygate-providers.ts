import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {useEffect, useRef, useState} from 'react'

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchProviders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          'https://api.paygate.to/control/provider-status/',
          {
            signal: abortController.signal,
          },
        )

        if (abortController.signal.aborted) {
          return
        }

        const data: ProviderStatusResponse = await response.json()

        if (abortController.signal.aborted) {
          return
        }

        // Filter for active providers only
        const activeProviders = data.providers.filter(
          (p) => p.status === 'active',
        )

        // Sort by minimum amount
        activeProviders.sort((a, b) => a.minimum_amount - b.minimum_amount)

        setProviders(activeProviders)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('Failed to fetch providers:', err)
        setError(
          err instanceof Error ? err : new Error('Failed to fetch providers'),
        )
        // Fallback to hardcoded providers if API fails
        if (!abortController.signal.aborted) {
          setProviders([
            {
              id: 'moonpay',
              provider_name: 'MoonPay',
              status: 'active',
              minimum_currency: 'USD',
              minimum_amount: 20,
            },
            {
              id: 'stripe',
              provider_name: 'Stripe (USA)',
              status: 'active',
              minimum_currency: 'USD',
              minimum_amount: 2,
            },
          ])
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchProviders()

    return () => {
      abortController.abort()
    }
  }, [])

  return {providers, loading, error}
}
