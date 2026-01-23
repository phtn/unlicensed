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
