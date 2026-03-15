'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

// Flag mapping for fiat currencies
const FIAT_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  PHP: '🇵🇭',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  SGD: '🇸🇬',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  HKD: '🇭🇰',
  KRW: '🇰🇷',
  INR: '🇮🇳',
  MXN: '🇲🇽',
  BRL: '🇧🇷',
}

// Color mapping for crypto currencies (POL is Polygon's rebranded native token)
const CRYPTO_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#00FFA3',
  USDC: '#2775CA',
  USDT: '#26A17B',
  BNB: '#F3BA2F',
  ADA: '#0033AD',
  DOT: '#E6007A',
  AVAX: '#E84142',
  MATIC: '#8247E5',
  POL: '#8247E5',
  LINK: '#2A5ADA',
  UNI: '#FF007A',
  XRP: '#7919ff',
  LTC: '#89CAF5',
  DOGE: '#C2A633',
  TRX: '#FF0605',
  ATOM: '#2F3148',
  ARB: '#28A0F0',
  TON: '#0098EB',
  BCH: '#0CC18F',
  DAI: '#22AF9F',
  OSMO: '#462ADF',
  SHIB: '#F18F3C',
  SAND: '#0084FF',
  APE: '#1057C1',
}

// Color mapping for blockchains
const BLOCKCHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  bitcoin: '#F7931A',
  litecoin: '#89CAF5',
  solana: '#00FFA3',
  polygon: '#8247E5',
  'polygon amoy': '#8247E5',
  avalanche: '#E84142',
  binance: '#F3BA2F',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  base: '#0052FF',
  tron: '#FF0605',
  xrp: '#23292F',
  ton: '#0098eb',
  osmosis: '#201b43',

  'bitcoin-cash': '#0CC18F',
}

const DEFAULT_BLOCKCHAIN = 'Ethereum'

const normalizeBlockchainValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')

/** Testnet → mainnet. Used to fetch mainnet exchange rates and USD value when user selects a testnet. */
const TESTNET_TO_MAINNET: Record<string, string> = {
  'polygon amoy': 'Polygon',
}

const supportsCurrencyOnBlockchain = (
  blockchain: Blockchain,
  currencySymbol: string,
) => {
  if (!currencySymbol || !blockchain.currencies?.length) return false

  const target = currencySymbol.toUpperCase()
  return blockchain.currencies.some((entry) => {
    if (typeof entry === 'string') {
      return entry.toUpperCase() === target
    }

    return entry.symbol.toUpperCase() === target
  })
}

const resolveMainnetBlockchain = (value: string) =>
  TESTNET_TO_MAINNET[normalizeBlockchainValue(value)] ?? value

export interface Currency {
  id: string
  symbol: string
  name: string
  type: 'FIAT' | 'CRYPTO'
  flag?: string
  color?: string
  blockchain?: string
}

export interface BlockchainCurrency {
  id?: string
  symbol: string
  name?: string
}

export interface Blockchain {
  id: string
  name: string
  symbol?: string
  color?: string
  currencies?: Array<BlockchainCurrency | string>
}

export interface Quote {
  fromAmount: string
  fromCurrency: string
  toAmount: string
  toCurrency: string
  toBlockchain: string
  rate: string
  toAmountUsdc?: string
  rateUsdc?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

interface InitializeResult {
  currencies: Currency[]
  blockchains: Blockchain[]
}

export const useCryptoConverter = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [blockchains, setBlockchains] = useState<Blockchain[]>([])
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initPromiseRef = useRef<Promise<InitializeResult> | null>(null)
  const quoteAbortRef = useRef<AbortController | null>(null)
  const quoteRequestIdRef = useRef(0)

  const cancelPendingQuote = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (quoteAbortRef.current) {
      quoteAbortRef.current.abort()
      quoteAbortRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cancelPendingQuote()
    }
  }, [cancelPendingQuote])

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch('/api/crypto/swapped', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category: 'currencies',
          method: 'list',
          params: {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch currencies')
      }

      const result: ApiResponse<{currencies: Currency[]}> =
        await response.json()

      if (result.success && result.data?.currencies) {
        // Enrich currencies with flags/colors
        const enriched = result.data.currencies.map((c) => ({
          ...c,
          flag:
            c.type === 'FIAT'
              ? (FIAT_FLAGS[c.symbol.toUpperCase()] ?? '🏳️')
              : undefined,
          color:
            c.type === 'CRYPTO'
              ? (CRYPTO_COLORS[c.symbol.toUpperCase()] ?? '#888888')
              : undefined,
        }))
        setCurrencies(enriched)
        return enriched
      }

      throw new Error(result.message ?? 'Failed to fetch currencies')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch currencies'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const fetchBlockchains = useCallback(async () => {
    try {
      const response = await fetch('/api/crypto/swapped', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category: 'blockchains',
          method: 'list',
          params: {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch blockchains')
      }

      const result: ApiResponse<{blockchains: Blockchain[]}> =
        await response.json()

      if (result.success && result.data?.blockchains) {
        // Enrich blockchains with colors
        const enriched = result.data.blockchains.map((b) => ({
          ...b,
          color:
            BLOCKCHAIN_COLORS[normalizeBlockchainValue(b.name)] ??
            BLOCKCHAIN_COLORS[normalizeBlockchainValue(b.id)] ??
            '#888888',
        }))
        setBlockchains(enriched)
        return enriched
      }

      throw new Error(result.message ?? 'Failed to fetch blockchains')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch blockchains'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const initialize = useCallback(async () => {
    if (initialized) return {currencies, blockchains}
    if (initPromiseRef.current) return initPromiseRef.current

    setLoading(true)
    setError(null)

    const initializePromise = Promise.all([
      fetchCurrencies(),
      fetchBlockchains(),
    ])
      .then(([fetchedCurrencies, fetchedBlockchains]) => {
        setInitialized(true)
        return {currencies: fetchedCurrencies, blockchains: fetchedBlockchains}
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize'
        setError(message)
        setInitialized(false)
        return {currencies: [], blockchains: []}
      })
      .finally(() => {
        setLoading(false)
        initPromiseRef.current = null
      })

    initPromiseRef.current = initializePromise
    return initializePromise
  }, [blockchains, currencies, fetchCurrencies, fetchBlockchains, initialized])

  const getQuote = useCallback(
    async (params: {
      fromAmount: string
      fromFiatCurrency: string
      toCurrency: string
      toBlockchain: string
    }) => {
      cancelPendingQuote()
      setLoadingQuote(false)

      // Validate inputs
      const amount = parseFloat(params.fromAmount)
      if (isNaN(amount) || amount <= 0) {
        setQuote(null)
        return
      }

      if (
        !params.fromFiatCurrency ||
        !params.toCurrency ||
        !params.toBlockchain
      ) {
        return
      }

      // Use mainnet for quote when on testnet so we get real exchange rates and USD value
      const quoteBlockchain = resolveMainnetBlockchain(params.toBlockchain)

      const quoteParams = {
        ...params,
        toBlockchain: quoteBlockchain,
      }

      // Debounce the API call
      debounceRef.current = setTimeout(async () => {
        const requestId = quoteRequestIdRef.current + 1
        quoteRequestIdRef.current = requestId

        const abortController = new AbortController()
        quoteAbortRef.current = abortController
        setLoadingQuote(true)
        setError(null)

        try {
          // Fetch main quote and USDC quote in parallel (both use mainnet when user chose testnet)
          const [mainResponse, usdcResponse] = await Promise.all([
            fetch('/api/crypto/swapped', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                category: 'quotes',
                method: 'get',
                params: quoteParams,
              }),
              signal: abortController.signal,
            }),
            // Fetch USDC quote (skip if already USDC) — use mainnet for USD value
            params.toCurrency.toUpperCase() !== 'USDC'
              ? (() => {
                  // Prefer mainnet that supports USDC for USD valuation
                  const usdcBlockchain =
                    blockchains.find(
                      (b) =>
                        !TESTNET_TO_MAINNET[normalizeBlockchainValue(b.name)] &&
                        !TESTNET_TO_MAINNET[normalizeBlockchainValue(b.id)] &&
                        supportsCurrencyOnBlockchain(b, 'USDC'),
                    )?.name ?? DEFAULT_BLOCKCHAIN

                  return fetch('/api/crypto/swapped', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      category: 'quotes',
                      method: 'get',
                      params: {
                        ...quoteParams,
                        toCurrency: 'USDC',
                        toBlockchain: usdcBlockchain,
                      },
                    }),
                    signal: abortController.signal,
                  })
                })()
              : Promise.resolve(null),
          ])

          if (
            abortController.signal.aborted ||
            quoteRequestIdRef.current !== requestId
          ) {
            return
          }

          const mainResult = await mainResponse.json()

          if (!mainResponse.ok) {
            throw new Error(mainResult.message ?? 'Failed to get quote')
          }

          if (mainResult.success && mainResult.data) {
            const data = mainResult.data as {
              fromAmount?: {amount?: string}
              toAmount?: {afterFees?: string; beforeFees?: string}
            }

            // Extract nested amounts (quote is for mainnet when user picked testnet)
            const fromAmt = parseFloat(
              data.fromAmount?.amount ?? params.fromAmount,
            )
            const toAmt = parseFloat(
              data.toAmount?.afterFees ?? data.toAmount?.beforeFees ?? '0',
            )

            if (
              abortController.signal.aborted ||
              quoteRequestIdRef.current !== requestId
            ) {
              return
            }

            // Calculate rate (how much crypto per 1 fiat)
            const rate = fromAmt > 0 ? toAmt / fromAmt : 0

            // Process USDC quote if available
            let toAmountUsdc: string | undefined
            let rateUsdc: string | undefined

            if (usdcResponse) {
              try {
                const usdcResult = await usdcResponse.json()
                if (usdcResult.success && usdcResult.data) {
                  const usdcData = usdcResult.data as {
                    fromAmount?: {amount?: string}
                    toAmount?: {afterFees?: string; beforeFees?: string}
                  }
                  const usdcFromAmt = parseFloat(
                    usdcData.fromAmount?.amount ?? params.fromAmount,
                  )
                  const usdcToAmt = parseFloat(
                    usdcData.toAmount?.afterFees ??
                      usdcData.toAmount?.beforeFees ??
                      '0',
                  )
                  const usdcRate = usdcFromAmt > 0 ? usdcToAmt / usdcFromAmt : 0
                  toAmountUsdc = usdcToAmt.toString()
                  rateUsdc = usdcRate.toString()
                }
              } catch (usdcErr) {
                if (
                  usdcErr instanceof DOMException &&
                  usdcErr.name === 'AbortError'
                ) {
                  return
                }
                // Silently fail USDC quote - it's optional
                console.warn('Failed to fetch USDC quote:', usdcErr)
              }
            } else if (params.toCurrency.toUpperCase() === 'USDC') {
              // If already USDC, use the same values
              toAmountUsdc = toAmt.toString()
              rateUsdc = rate.toString()
            }

            if (
              abortController.signal.aborted ||
              quoteRequestIdRef.current !== requestId
            ) {
              return
            }

            setQuote({
              fromAmount: params.fromAmount,
              fromCurrency: params.fromFiatCurrency,
              toAmount: toAmt.toString(),
              toCurrency: params.toCurrency,
              toBlockchain: params.toBlockchain,
              rate: rate.toString(),
              toAmountUsdc,
              rateUsdc,
            })
          } else {
            throw new Error(mainResult.message ?? 'Failed to get quote')
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return
          }
          const message =
            err instanceof Error ? err.message : 'Failed to get quote'
          setError(message)
          setQuote(null)
        } finally {
          if (quoteRequestIdRef.current === requestId) {
            quoteAbortRef.current = null
            setLoadingQuote(false)
          }
        }
      }, 300)
    },
    [blockchains, cancelPendingQuote],
  )

  const clearQuote = useCallback(() => {
    cancelPendingQuote()
    setLoadingQuote(false)
    setQuote(null)
    setError(null)
  }, [cancelPendingQuote])

  // Get fiat and crypto currencies separately
  const fiatCurrencies = currencies.filter((c) => c.type === 'FIAT')
  const cryptoCurrencies = currencies.filter((c) => c.type === 'CRYPTO')

  return {
    currencies,
    fiatCurrencies,
    cryptoCurrencies,
    blockchains,
    quote,
    loading,
    loadingQuote,
    error,
    initialized,
    initialize,
    getQuote,
    clearQuote,
  }
}
