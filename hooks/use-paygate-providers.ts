import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import useSWR from 'swr'

const PROVIDERS_URL = 'https://api.paygate.to/control/provider-status/'

const fetcher = async (url: string): Promise<Provider[]> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch providers')
  }
  const data: ProviderStatusResponse = await response.json()

  // Filter for active providers only
  const activeProviders = data.providers.filter((p) => p.status === 'active')

  // Sort by minimum amount (using toSorted for immutability)
  return activeProviders.toSorted(
    (a, b) => a.minimum_amount - b.minimum_amount,
  )
}

const fallbackProviders: Provider[] = [
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
]

export function useProviders() {
  const {data, error, isLoading} = useSWR<Provider[]>(
    PROVIDERS_URL,
    fetcher,
    {
      fallbackData: fallbackProviders,
      onError: (err) => {
        console.error('Failed to fetch providers:', err)
      },
    },
  )

  return {
    providers: data ?? fallbackProviders,
    loading: isLoading,
    error: error ? (error instanceof Error ? error : new Error('Failed to fetch providers')) : null,
  }
}
