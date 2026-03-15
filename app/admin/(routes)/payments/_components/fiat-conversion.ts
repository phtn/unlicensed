import type {FiatCurrency} from '../types'

interface FiatRateMapInput {
  fromCurrency: FiatCurrency
  toCurrency: FiatCurrency
  fromRate: string | null
  toRate: string | null
}

interface ConvertFiatAmountInput {
  amount: string
  from: FiatCurrency
  to: FiatCurrency
  rateMap: Partial<Record<FiatCurrency, number>>
}

function parseRate(rate: string | null): number | null {
  if (!rate) return null

  const parsed = Number.parseFloat(rate)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function getFiatRateMap({
  fromCurrency,
  toCurrency,
  fromRate,
  toRate,
}: FiatRateMapInput): Partial<Record<FiatCurrency, number>> {
  const rateMap: Partial<Record<FiatCurrency, number>> = {
    USD: 1,
  }

  const parsedFromRate = fromCurrency === 'USD' ? 1 : parseRate(fromRate)
  const parsedToRate = toCurrency === 'USD' ? 1 : parseRate(toRate)

  if (parsedFromRate !== null) {
    rateMap[fromCurrency] = parsedFromRate
  }

  if (parsedToRate !== null) {
    rateMap[toCurrency] = parsedToRate
  }

  return rateMap
}

export function convertFiatAmount({
  amount,
  from,
  to,
  rateMap,
}: ConvertFiatAmountInput): string {
  const numAmount = Number.parseFloat(amount)
  if (!amount || !Number.isFinite(numAmount) || numAmount <= 0) {
    return ''
  }

  if (from === to) {
    return amount
  }

  const fromRate = rateMap[from] ?? null
  const toRate = rateMap[to] ?? null

  if (fromRate === null || toRate === null || fromRate === 0 || toRate === 0) {
    return ''
  }

  return ((numAmount * fromRate) / toRate).toFixed(8).replace(/\.?0+$/, '')
}
