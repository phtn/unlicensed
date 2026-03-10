'use client'

import {api} from '@/convex/_generated/api'
import {useApiCall} from '@/hooks/use-api-call'
import {useCurrencyConversion} from '@/hooks/use-currency-converter'
import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Card, Select, SelectItem, Tab, Tabs} from '@heroui/react'
import {useQuery} from 'convex/react'
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import {FiatCurrency} from '../../types'

interface ConverterFieldProps {
  className?: string
  isLast?: boolean
  value: string | null
  onValueChange: (e: ChangeEvent<HTMLInputElement>) => void
  currencyId: string | null
  onCurrencyChange: (currencyId: string) => void
  currencies: Array<string>
  onSwap?: () => void
  loading?: boolean
  disableCurrencySelect?: boolean
}

function ConverterField({
  className,
  isLast,
  value,
  onValueChange,
  currencyId,
  onCurrencyChange,
  currencies,
  onSwap,
  loading,
  disableCurrencySelect = false,
}: ConverterFieldProps) {
  const {on: swap, toggle: toggleSwap} = useToggle()
  const handleSwap = () => {
    if (onSwap) onSwap()
    toggleSwap()
  }
  return (
    <>
      {isLast && onSwap && (
        <button
          type='button'
          onClick={handleSwap}
          className={cn(
            'flex items-center justify-center inset-shadow-[0_1px_rgb(255_255_255/0.35)] absolute top-1/2 -translate-y-1/2 z-10',
            'size-14.5 aspect-square rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-600 cursor-pointer',
            {'rotate-180': swap},
          )}
          aria-label='swap-currencies'>
          <Icon name='swap-round' className='text-white -rotate-25 size-9' />
        </button>
      )}
      <Card
        className={cn(
          'relative w-full flex-row items-center justify-between gap-2 p-4 dark:bg-sidebar bg-sidebar/60',
          isLast
            ? 'mask-[radial-gradient(ellipse_26px_24px_at_50%_0%,transparent_0,transparent_24px,black_25px)]'
            : 'mask-[radial-gradient(ellipse_26px_24px_at_50%_100%,transparent_0,transparent_24px,black_25px)]',
          className,
        )}>
        {isLast && (
          <div
            className='absolute -top-px left-1/2 -translate-x-1/2 w-12.5 h-6.25 rounded-b-full border-b border-x border-white/15'
            aria-hidden='true'></div>
        )}
        <div className='grow flex items-center justify-between w-full gap-12'>
          {!isLast ? (
            <input
              value={value ?? ''}
              onChange={onValueChange}
              className={cn(
                'w-full max-w-40 text-xl font-semibold bg-transparent focus-visible:outline-none py-0.5 px-1 -ml-1 mb-0.5 rounded-lg appearance-none font-space',
                {'w-24': !isLast},
              )}
              type='number'
              placeholder='0'
            />
          ) : (
            <div className='text-xl font-medium font-space flex items-center space-x-2'>
              <span className='opacity-60 font-brk'>{currencyId}</span>{' '}
              {loading ? (
                <Icon name='spinner-dots' />
              ) : Number.isFinite(Number(value)) && value !== '' ? (
                <span>{Number(value).toFixed(4)}</span>
              ) : (
                <span>0.0000</span>
              )}
            </div>
          )}
          <div>
            <Select
              disabled={disableCurrencySelect}
              selectedKeys={
                currencyId ? new Set([currencyId]) : new Set(['EUR'])
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string
                if (selected) {
                  onCurrencyChange(selected)
                }
              }}
              classNames={{
                trigger: [
                  'w-28 flex bg-transparent border-none font-space shadow-none bg-white/10',
                ],
                value: 'text-lg font-medium font-brk',
              }}
              aria-label='Select currency'>
              {currencies.map((curr) => (
                <SelectItem key={curr} className='font-brk'>
                  {curr}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </Card>
    </>
  )
}

const CURRENCIES: Array<FiatCurrency> = [
  'USD',
  'EUR',
  'CAD',
  'GBP',
  'AUD',
  'JPY',
  'CHF',
  'CNY',
  'INR',
  'BRL',
  'MXN',
  'SGD',
  'HKD',
  'NZD',
  'ZAR',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'TRY',
  'PHP',
]

const CRYPTO_CURRENCIES = [
  'BTC',
  'ETH',
  'SOL',
  'USDC',
  'USDT',
  'XRP',
  'DOGE',
  'TRX',
  'BNB',
  'POL',
] as const

const normalizeGatewayTickers = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [...CRYPTO_CURRENCIES]

  const normalized = value.flatMap((item) => {
    if (typeof item !== 'string') return []
    const ticker = item.trim()
    return ticker ? [ticker.toUpperCase()] : []
  })

  return normalized.length > 0 ? normalized : [...CRYPTO_CURRENCIES]
}

const getGatewayTickerLabel = (ticker: string) => ticker.toUpperCase()

const parseGatewayPrices = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rawValue]) => {
      const parsed =
        typeof rawValue === 'number'
          ? rawValue
          : typeof rawValue === 'string'
            ? Number.parseFloat(rawValue)
            : Number.NaN

      return Number.isFinite(parsed) ? [[key.toUpperCase(), parsed]] : []
    }),
  )
}

const parseGatewayMinimum = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const CurrencyConverter = () => {
  return (
    <div className='relative my-2 md:my-6'>
      <Tabs title='Converters' className='flex-1 ml-54 md:ml-80'>
        <Tab
          value='converter-1'
          title='Fiat'
          className='flex-1 data-[state=active]:shadow-none data-[state=active]:bg-transparent relative before:absolute before:inset-y-2 before:-left-px before:w-px before:bg-border dark:before:bg-card first:before:hidden'>
          <ConverterContent currencies={CURRENCIES} />
        </Tab>
        <Tab
          value='tab-2'
          title='Crypto'
          className='flex-1 data-[state=active]:shadow-none data-[state=active]:bg-transparent relative before:absolute before:inset-y-2 before:-left-px before:w-px before:bg-border dark:before:bg-card first:before:hidden'>
          <CryptoConverterContent />
        </Tab>
      </Tabs>

      <h2 className='text-xl md:text-xl font-polysans font-semibold absolute top-1.5 left-2'>
        Converters
      </h2>
    </div>
  )
}
interface ConverterContentProps {
  currencies: Array<FiatCurrency>
}
function ConverterContent({currencies}: ConverterContentProps) {
  const [fromAmount, setFromAmount] = useState('1')
  const [toAmount, setToAmount] = useState('0')
  const [fromCurrency, setFromCurrency] = useState<FiatCurrency>(
    currencies[1] ?? 'EUR',
  )
  const [toCurrency, setToCurrency] = useState<FiatCurrency>(
    currencies[0] ?? 'USD',
  )
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null)
  const [isPending, startTransition] = useTransition()
  // Initialize refs with empty values to trigger conversion on first render
  const prevFromAmountRef = useRef('')
  const prevToAmountRef = useRef('')
  const prevFromCurrencyRef = useRef<FiatCurrency | null>(null)
  const prevToCurrencyRef = useRef<FiatCurrency | null>(null)
  const prevFromRateRef = useRef<string | null>(null)
  const prevToRateRef = useRef<string | null>(null)
  const hasInitializedRef = useRef(false)

  // Always get exchange rates for both currencies (using 1 as base amount)
  // Note: USD returns null from hook (it skips API call), so we handle it specially
  const fromConversion = useCurrencyConversion('1', fromCurrency)
  const toConversion = useCurrencyConversion('1', toCurrency)

  // Get effective exchange rates (USD is always 1.0)
  const fromRate = fromCurrency === 'USD' ? '1' : fromConversion.exchangeRate
  const toRate = toCurrency === 'USD' ? '1' : toConversion.exchangeRate

  // Calculate cross-currency conversion
  const calculateConversion = useCallback(
    (amount: string, from: string, to: string) => {
      const numAmount = parseFloat(amount)
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        return ''
      }

      // If converting to same currency, return same amount
      if (from === to) {
        return amount
      }

      // Get exchange rates (both are rates to USD)
      // Use effective rates that handle USD specially
      const effectiveFromRate =
        from === 'USD' ? 1 : fromRate ? parseFloat(fromRate) : null
      const effectiveToRate =
        to === 'USD' ? 1 : toRate ? parseFloat(toRate) : null

      if (
        effectiveFromRate === null ||
        effectiveToRate === null ||
        effectiveFromRate === 0 ||
        effectiveToRate === 0
      ) {
        return ''
      }

      // Convert: amount_to = (amount_from * rate_from) / rate_to
      const usdValue = numAmount * effectiveFromRate
      const convertedAmount = usdValue / effectiveToRate

      return convertedAmount.toFixed(8).replace(/\.?0+$/, '')
    },
    [fromRate, toRate],
  )

  // Update derived amounts using startTransition to avoid cascading renders
  // Trigger conversion when first field (!isLast) input or currency changes
  useEffect(() => {
    // Always convert from first field when it has a value, or when activeField is 'from'
    // On initial render, we want to convert if we have fromAmount
    const shouldConvert =
      activeField === 'from' ||
      (activeField !== 'to' && fromAmount) ||
      (!hasInitializedRef.current && fromAmount)

    const amountChanged = fromAmount !== prevFromAmountRef.current
    const currencyChanged =
      fromCurrency !== prevFromCurrencyRef.current ||
      toCurrency !== prevToCurrencyRef.current
    // Use effective rates (USD is always 1.0)
    const ratesAvailable = fromRate && toRate

    // On initial render, always trigger conversion if we have the necessary data
    const isInitialRender = !hasInitializedRef.current

    // Track previous rates to detect when they become available
    // Also trigger on initial render if rates are available
    const ratesJustLoaded =
      ((!prevFromRateRef.current || !prevToRateRef.current) &&
        ratesAvailable) ||
      (isInitialRender && ratesAvailable)

    // Always trigger if rates just loaded (even if shouldConvert is false)
    // OR if shouldConvert is true and something changed
    const shouldTrigger =
      ratesJustLoaded ||
      (shouldConvert &&
        (amountChanged ||
          currencyChanged ||
          (isInitialRender && ratesAvailable)))

    if (shouldTrigger) {
      prevFromAmountRef.current = fromAmount
      prevFromCurrencyRef.current = fromCurrency
      prevToCurrencyRef.current = toCurrency
      prevFromRateRef.current = fromRate
      prevToRateRef.current = toRate
      hasInitializedRef.current = true

      if (fromAmount && toCurrency && ratesAvailable) {
        const converted = calculateConversion(
          fromAmount,
          fromCurrency,
          toCurrency,
        )
        startTransition(() => {
          setToAmount(converted || '')
        })
      } else if (!fromAmount) {
        startTransition(() => {
          setToAmount('')
        })
      }
    }
  }, [
    activeField,
    fromAmount,
    fromCurrency,
    toCurrency,
    calculateConversion,
    fromRate,
    toRate,
  ])

  useEffect(() => {
    if (activeField === 'to') {
      const amountChanged = toAmount !== prevToAmountRef.current
      const currencyChanged =
        fromCurrency !== prevFromCurrencyRef.current ||
        toCurrency !== prevToCurrencyRef.current

      if (amountChanged || currencyChanged) {
        prevToAmountRef.current = toAmount
        prevFromCurrencyRef.current = fromCurrency
        prevToCurrencyRef.current = toCurrency

        if (toAmount && toCurrency) {
          const converted = calculateConversion(
            toAmount,
            toCurrency,
            fromCurrency,
          )
          startTransition(() => {
            setFromAmount(converted || '')
          })
        } else {
          startTransition(() => {
            setFromAmount('')
          })
        }
      }
    }
  }, [activeField, toAmount, toCurrency, fromCurrency, calculateConversion])

  const handleSwap = useCallback(() => {
    const tempAmount = fromAmount
    const tempCurrency = fromCurrency
    const newFromAmount = toAmount
    const newToAmount = tempAmount
    prevFromAmountRef.current = newFromAmount
    prevToAmountRef.current = newToAmount
    setFromAmount(newFromAmount)
    setToAmount(newToAmount)
    if (toCurrency) {
      setFromCurrency(toCurrency)
    }
    setToCurrency(tempCurrency)
    setActiveField(
      activeField === 'from' ? 'to' : activeField === 'to' ? 'from' : null,
    )
  }, [fromAmount, toAmount, fromCurrency, toCurrency, activeField])

  const handleFromChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setFromAmount(e.target.value)
    setActiveField('from')
  }, [])

  const handleToChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setToAmount(e.target.value)
    setActiveField('to')
  }, [])

  const handleFromCurrencyChange = useCallback((currency: string) => {
    setFromCurrency(currency as FiatCurrency)
    // Set activeField to 'from' to trigger conversion when currency changes
    setActiveField('from')
  }, [])

  const handleToCurrencyChange = useCallback((currency: string) => {
    setToCurrency(currency as FiatCurrency)
  }, [])

  const loading = fromConversion.loading || toConversion.loading || isPending

  // Calculate exchange rate from fromCurrency to toCurrency
  // Calculate directly in render to ensure reactivity
  const getExchangeRate = useCallback(() => {
    // Get effective exchange rates (USD is always 1.0)
    const fromRateNum =
      fromCurrency === 'USD'
        ? 1
        : fromConversion.exchangeRate
          ? parseFloat(fromConversion.exchangeRate)
          : null
    const toRateNum =
      toCurrency === 'USD'
        ? 1
        : toConversion.exchangeRate
          ? parseFloat(toConversion.exchangeRate)
          : null

    if (fromRateNum === null || toRateNum === null) {
      return null
    }

    if (
      isNaN(fromRateNum) ||
      isNaN(toRateNum) ||
      fromRateNum === 0 ||
      toRateNum === 0
    ) {
      return null
    }

    // Calculate rate: fromCurrency -> USD -> toCurrency
    // If fromCurrency is USD, rate is 1/toRate
    // If toCurrency is USD, rate is fromRate
    // Otherwise, rate is fromRate/toRate
    if (fromCurrency === 'USD') {
      return 1 / toRateNum
    }
    if (toCurrency === 'USD') {
      return fromRateNum
    }
    return fromRateNum / toRateNum
  }, [
    fromCurrency,
    fromConversion.exchangeRate,
    toCurrency,
    toConversion.exchangeRate,
  ])

  const exchangeRate = getExchangeRate()

  return (
    <div className='w-full md:max-w-md my-3'>
      <div className='relative flex flex-col items-center gap-1 mb-4'>
        <ConverterField
          value={fromAmount}
          onValueChange={handleFromChange}
          currencyId={fromCurrency}
          onCurrencyChange={handleFromCurrencyChange}
          currencies={currencies}
          loading={loading && activeField === 'from'}
        />
        <ConverterField
          isLast
          value={toAmount}
          onValueChange={handleToChange}
          currencyId={toCurrency}
          onCurrencyChange={handleToCurrencyChange}
          currencies={currencies}
          onSwap={handleSwap}
          loading={loading}
        />
      </div>
      <div className='pb-3 ps-3 uppercase text-foreground/50 text-xs font-medium tracking-widest'>
        Summary
      </div>
      <Card
        id='summary'
        shadow='none'
        className='p-4 gap-0 rounded-2xl dark:bg-sidebar bg-sidebar/25'>
        <ul className='text-sm'>
          <li className='flex items-center font-medium justify-between pb-3 mb-3'>
            <span className='tracking-tight font-brk'>Exchange rate</span>
            <div className=''>
              <span className='flex items-center font-space space-x-1 text-gray-700 dark:text-gray-300'>
                <span className='font-brk'>1 {fromCurrency} =</span>
                {exchangeRate !== null ? (
                  <span>{exchangeRate.toFixed(4)}</span>
                ) : (
                  <div className='px-3'>
                    <Icon name='spinner-dots' className='size-4' />
                  </div>
                )}
                <span className='font-brk'>{toCurrency}</span>
              </span>
            </div>
          </li>
          <li className='flex items-center justify-between font-medium'>
            <span className='tracking-tight font-brk'>Last updated</span>
            <span className='font-brk'>{new Date().toLocaleTimeString()}</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

function CryptoConverterContent() {
  const gatewayDoc = useQuery(api.gateways.q.getByGateway, {gateway: 'paygate'})
  const {
    handleApiCall: handleSupportedTickers,
    response: tickersResponse,
    loading: isLoadingTickers,
  } = useApiCall()
  const {
    handleApiCall: handleQuoteRequest,
    response: quoteResponse,
    loading: isLoadingQuote,
  } = useApiCall()
  const [, startTransition] = useTransition()
  const [fromAmount, setFromAmount] = useState('1')
  const [toAmount, setToAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState<string>('BTC')
  const [toCurrency, setToCurrency] = useState<FiatCurrency>('USD')

  const apiUrl = gatewayDoc?.apiUrl?.trim() || 'https://api.paygate.to'
  const supportedTickers = normalizeGatewayTickers(
    (
      tickersResponse?.data as
        | {supported?: unknown; tickers?: unknown}
        | undefined
    )?.supported ??
      (
        tickersResponse?.data as
          | {supported?: unknown; tickers?: unknown}
          | undefined
      )?.tickers,
  )
  const effectiveFromCurrency = supportedTickers.includes(fromCurrency)
    ? fromCurrency
    : (supportedTickers[0] ?? 'BTC')

  useEffect(() => {
    if (gatewayDoc === undefined) return
    void handleSupportedTickers(`${apiUrl.replace(/\/$/, '')}/crypto/info.php`)
  }, [apiUrl, gatewayDoc, handleSupportedTickers])

  useEffect(() => {
    if (!effectiveFromCurrency) return

    const ticker = effectiveFromCurrency.toLowerCase()
    const url = `${apiUrl.replace(/\/$/, '')}/crypto/${ticker}/fees.php`
    void handleQuoteRequest(url)
  }, [apiUrl, effectiveFromCurrency, handleQuoteRequest])

  useEffect(() => {
    const prices = parseGatewayPrices(
      (quoteResponse?.data as {prices?: unknown} | undefined)?.prices,
    )
    const rate = prices[toCurrency]
    const parsedAmount = Number.parseFloat(fromAmount)

    const converted =
      !Number.isFinite(parsedAmount) || parsedAmount <= 0 || rate == null
        ? ''
        : (parsedAmount * rate).toFixed(8).replace(/\.?0+$/, '')

    startTransition(() => {
      setToAmount(converted)
    })
  }, [fromAmount, quoteResponse?.data, startTransition, toCurrency])

  const handleFromChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setFromAmount(e.target.value)
  }, [])

  const handleFromCurrencyChange = useCallback((currency: string) => {
    setFromCurrency(currency)
  }, [])

  const handleToCurrencyChange = useCallback((currency: string) => {
    setToCurrency(currency as FiatCurrency)
  }, [])

  const quoteError = quoteResponse?.error || tickersResponse?.error
  const priceMap = parseGatewayPrices(
    (quoteResponse?.data as {prices?: unknown} | undefined)?.prices,
  )
  const exchangeRate = priceMap[toCurrency] ?? null
  const minimum = parseGatewayMinimum(
    (quoteResponse?.data as {minimum?: unknown} | undefined)?.minimum,
  )
  const coinName =
    typeof (quoteResponse?.data as {coin?: unknown} | undefined)?.coin ===
    'string'
      ? ((quoteResponse?.data as {coin?: string}).coin ??
        getGatewayTickerLabel(effectiveFromCurrency))
      : getGatewayTickerLabel(effectiveFromCurrency)
  const summaryTimestamp = new Date().toLocaleTimeString()

  if (quoteError) {
    return (
      <div className='w-full md:max-w-md my-3'>
        <Card
          shadow='none'
          className='p-4 gap-2 rounded-2xl dark:bg-sidebar bg-sidebar/25'>
          <div className='text-sm text-danger'>Failed to load crypto quote</div>
          <div className='text-xs text-foreground/60'>{quoteError}</div>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full md:max-w-md my-3'>
      <div className='relative flex flex-col items-center gap-1 mb-4'>
        <ConverterField
          value={fromAmount}
          onValueChange={handleFromChange}
          currencyId={getGatewayTickerLabel(effectiveFromCurrency)}
          onCurrencyChange={handleFromCurrencyChange}
          currencies={supportedTickers}
          loading={isLoadingTickers || isLoadingQuote}
        />
        <ConverterField
          isLast
          value={toAmount}
          onValueChange={handleFromChange}
          currencyId={toCurrency}
          onCurrencyChange={handleToCurrencyChange}
          currencies={CURRENCIES}
          loading={isLoadingTickers || isLoadingQuote}
        />
      </div>
      <div className='pb-3 ps-3 uppercase text-foreground/50 text-xs font-medium tracking-widest'>
        Summary
      </div>
      <Card
        id='crypto-summary'
        shadow='none'
        className='p-4 gap-0 rounded-2xl dark:bg-sidebar bg-sidebar/25'>
        <ul className='text-sm'>
          <li className='flex items-center font-medium justify-between pb-3 mb-3'>
            <span className='tracking-tight font-brk'>Exchange rate</span>
            <div>
              <span className='flex items-center font-space space-x-1 text-gray-700 dark:text-gray-300'>
                <span className='font-brk'>1 {coinName} =</span>
                {exchangeRate !== null ? (
                  <span>{exchangeRate.toFixed(6)}</span>
                ) : (
                  <div className='px-3'>
                    <Icon name='spinner-dots' className='size-4' />
                  </div>
                )}
                <span className='font-brk'>{toCurrency}</span>
              </span>
            </div>
          </li>
          <li className='flex items-center font-medium justify-between pb-3 mb-3'>
            <span className='tracking-tight font-brk'>Minimum</span>
            <span className='font-space text-gray-700 dark:text-gray-300'>
              {minimum !== null ? minimum.toFixed(8) : 'N/A'}{' '}
              {getGatewayTickerLabel(effectiveFromCurrency)}
            </span>
          </li>
          <li className='flex items-center justify-between font-medium'>
            <span className='tracking-tight font-brk'>Last updated</span>
            <span className='font-brk'>{summaryTimestamp}</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
