import {FiatCurrency} from '@/app/admin/(routes)/payments/paygate/types'
import {useEffect, useRef, useState} from 'react'

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

export function useCurrencyConversion(
  amount: string,
  fromCurrency: FiatCurrency | null,
): UseCurrencyConversionResult {
  const [usdValue, setUsdValue] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Reset state when inputs change
    setUsdValue(null)
    setExchangeRate(null)
    setError(null)

    // Don't convert if amount is empty, invalid, or currency is already USD
    const numAmount = parseFloat(amount)
    if (
      !amount ||
      isNaN(numAmount) ||
      numAmount <= 0 ||
      fromCurrency === 'USD'
    ) {
      setLoading(false)
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)

    const fetchConversion = async () => {
      try {
        if (!fromCurrency) {
          setUsdValue(null)
          setExchangeRate(null)
          return
        }
        const url = `https://api.paygate.to/control/convert.php?from=${encodeURIComponent(fromCurrency)}&value=${encodeURIComponent(amount)}`

        const response = await fetch(url, {
          signal: abortController.signal,
        })

        if (abortController.signal.aborted) {
          return
        }

        if (!response.ok) {
          throw new Error(`Conversion failed: ${response.statusText}`)
        }

        const data: ConversionResponse = await response.json()

        if (abortController.signal.aborted) {
          return
        }

        if (
          data.status === 'success' &&
          data.value_coin &&
          data.exchange_rate
        ) {
          setUsdValue(data.value_coin)
          setExchangeRate(data.exchange_rate)
        } else {
          throw new Error('Invalid conversion response')
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.name !== 'AbortError' &&
          !abortController.signal.aborted
        ) {
          console.error('Currency conversion error:', err)
          setError(err)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    // Debounce the API call slightly to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchConversion()
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [amount, fromCurrency])

  return {usdValue, exchangeRate, loading, error}
}
