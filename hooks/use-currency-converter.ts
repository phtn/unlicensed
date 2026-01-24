import {FiatCurrency} from '@/app/admin/(routes)/payments/paygate/types'
import useSWR from 'swr'

interface ConversionResponse {
  status: string
  value_coin: string
  exchange_rate: string
}

interface UseCurrencyConversionResult {
  usdValue: string | null
  exchangeRate: string | null
  loading: boolean
  error: Error | null
}

const fetcher = async (url: string): Promise<ConversionResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Conversion failed: ${response.statusText}`)
  }
  const data: ConversionResponse = await response.json()
  if (
    data.status === 'success' &&
    data.value_coin &&
    data.exchange_rate
  ) {
    return data
  }
  throw new Error('Invalid conversion response')
}

export function useCurrencyConversion(
  amount: string,
  fromCurrency: FiatCurrency | null,
): UseCurrencyConversionResult {
  // Don't convert if amount is empty, invalid, or currency is already USD
  const numAmount = parseFloat(amount)
  const shouldFetch =
    amount &&
    !isNaN(numAmount) &&
    numAmount > 0 &&
    fromCurrency !== null &&
    fromCurrency !== 'USD'

  const url = shouldFetch
    ? `https://api.paygate.to/control/convert.php?from=${encodeURIComponent(fromCurrency)}&value=${encodeURIComponent(amount)}`
    : null

  const {data, error, isLoading} = useSWR<ConversionResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300, // Debounce equivalent - dedupe requests within 300ms
    },
  )

  return {
    usdValue: data?.value_coin ?? null,
    exchangeRate: data?.exchange_rate ?? null,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error
        : new Error('Currency conversion failed')
      : null,
  }
}
