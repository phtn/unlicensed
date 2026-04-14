export type CurrencyType = 'USD' | 'EUR' | 'GBP'

export function mapCurrencyToSign(currency: CurrencyType) {
  switch (currency) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'

    default:
      return currency
  }
}

export const currencyConverter = (amount: string | null) => {
  if (amount) {
    const calculated = Number(amount) * 1.065
    // Ensure we have a valid number and format to 2 decimal places
    if (!isNaN(calculated) && isFinite(calculated) && calculated > 0) {
      return calculated.toFixed(2)
    }
  }
  return undefined
}

const USD_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const

function truncateToCents(dollars: number): number {
  const scaled = dollars * 100
  return (scaled >= 0 ? Math.floor(scaled) : Math.ceil(scaled)) / 100
}

/** Format dollars for display (e.g. $12.99) */
export function formatDecimalUSD(dollars: number): string {
  return dollars.toLocaleString('en-US', USD_FORMAT_OPTIONS)
}

/** Format dollars by dropping the 3rd decimal instead of rounding (e.g. $12.999 -> $12.99) */
export function decimalUSD(dollars: number): string {
  return truncateToCents(dollars).toLocaleString('en-US', USD_FORMAT_OPTIONS)
}
